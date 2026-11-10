"""Repeatable functional API audit using only Python's standard library.

Run against docs/audit/compose.audit.yaml, never a shared/production database.
Writes synthetic users, apps, incidents and deployments to the disposable stack.
Results contain assertions and HTTP codes; no credentials or tokens are saved.
"""
import argparse
import json
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--base', default='http://127.0.0.1:18081')
parser.add_argument('--proxy', default='http://127.0.0.1:18080')
args = parser.parse_args()
results = []
operations = set()


def request(method, path, body=None, token=None, base=None, headers=None):
    operations.add((method.lower(), path.split('?')[0]))
    h = {'Accept': 'application/json', **(headers or {})}
    if token:
        h['Authorization'] = 'Bearer ' + token
    data = None if body is None else json.dumps(body).encode()
    if data is not None:
        h['Content-Type'] = 'application/json'
    req = urllib.request.Request((base or args.base) + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            status, raw, response_headers = response.status, response.read(), dict(response.headers)
    except urllib.error.HTTPError as error:
        status, raw, response_headers = error.code, error.read(), dict(error.headers)
    try:
        value = json.loads(raw)
    except (ValueError, UnicodeDecodeError):
        value = raw.decode(errors='replace')
    return status, value, response_headers


def check(name, condition, detail=''):
    results.append({'name': name, 'passed': bool(condition), 'detail': detail})
    print(('PASS ' if condition else 'FAIL ') + name, flush=True)


def call(name, method, path, expected=200, body=None, token=None, **kwargs):
    status, value, headers = request(method, path, body, token, **kwargs)
    check(name, status in (expected if isinstance(expected, tuple) else (expected,)), f'HTTP {status}; expected {expected}')
    operations.add((method.lower(), path.split('?')[0]))
    return value


def login(email, password='Audit@12345'):
    data = call('Login ' + email, 'POST', '/api/v1/auth/login', body={'email': email, 'password': password})
    return data


def wait_deployment(deployment, expected):
    started = time.monotonic()
    while time.monotonic() - started < 25:
        status, current, _ = request('GET', f'/api/v1/deployments/{deployment["id"]}', token=admin)
        if status != 200 or current.get('status') not in ('QUEUED', 'RUNNING'):
            check(f'Deployment {deployment["id"]} finishes as {expected}', status == 200 and current.get('status') == expected,
                  f'HTTP {status}; status {current.get("status")}')
            return current
        time.sleep(.2)
    check(f'Deployment {deployment["id"]} finishes as {expected}', False, 'Timeout after 25 seconds')
    return current


def deploy(version, env='DEV', token=None, **extra):
    return call(f'Request {env} {version}', 'POST', '/api/v1/deployments', 202,
                {'applicationId': app_id, 'environment': env, 'version': version, **extra}, token or admin)


def stream_test():
    # Observe an authenticated stream while generating a real backend event.
    operations.add(('get', '/api/v1/events/stream'))
    seen = []
    ready = threading.Event()
    def reader():
        try:
            req = urllib.request.Request(args.proxy + '/api/v1/events/stream?access_token=' + urllib.parse.quote(admin))
            with urllib.request.urlopen(req, timeout=8) as response:
                check('SSE via Nginx has event-stream content type', 'text/event-stream' in response.headers.get('Content-Type', ''))
                ready.set()
                for line in response:
                    if line.startswith(b'event:'):
                        seen.append(line.decode().strip().split(':', 1)[1].strip())
                    if 'application.created' in seen:
                        break
        except Exception as error:
            # Do not record exception URLs, which could include an access token.
            check('SSE stream reader completes', False, type(error).__name__)
            ready.set()
    worker = threading.Thread(target=reader, daemon=True)
    worker.start()
    ready.wait(8)
    call('Create application while SSE connected', 'POST', '/api/v1/applications', 201,
         {**app_body, 'name': 'audit-stream-app'}, admin)
    worker.join(10)
    check('SSE emits ready and application.created', 'ready' in seen and 'application.created' in seen, ', '.join(seen))


try:
    call('Backend health', 'GET', '/actuator/health')
    call('Readiness health', 'GET', '/actuator/health/readiness')
    call('Frontend served by Nginx', 'GET', '/', base=args.proxy)
    call('Health through Nginx', 'GET', '/actuator/health', base=args.proxy)
    schema = call('OpenAPI schema', 'GET', '/v3/api-docs')
    documented = sorted((method, path) for path, item in schema['paths'].items() for method in item if method in ('get','post','patch','put','delete'))
    call('Protected list rejects anonymous access', 'GET', '/api/v1/applications', 401)
    call('Invalid bearer token rejected', 'GET', '/api/v1/applications', 401, token='invalid')
    session = login('admin@platformops.dev', 'Admin@12345')
    admin = session['accessToken']
    me = call('Current authenticated user', 'GET', '/api/v1/auth/me', token=admin)
    check('Demo admin role', me.get('role') == 'ADMIN')
    call('Authenticated API through Nginx', 'GET', '/api/v1/auth/me', token=admin, base=args.proxy)

    role_sessions, role_ids = {}, {}
    for role in ('DEVOPS', 'DEVELOPER'):
        email = 'audit-' + role.lower() + '@example.test'
        user = call('Admin creates ' + role, 'POST', '/api/v1/users', 201,
                    {'email': email, 'fullName': 'Audit ' + role, 'password': 'Audit@12345', 'role': role}, admin)
        role_ids[role] = user['id']
        role_sessions[role] = login(email)
    devops, developer = [role_sessions[r]['accessToken'] for r in ('DEVOPS','DEVELOPER')]
    call('People list and search', 'GET', '/api/v1/users?q=audit&size=2', token=admin)
    call('User details', 'GET', f'/api/v1/users/{role_ids["DEVELOPER"]}', token=admin)
    call('Non-admin user creation denied', 'POST', '/api/v1/users', 403,
         {'email':'denied@example.test','fullName':'Denied User','password':'Audit@12345','role':'ADMIN'}, developer)
    call('Admin cannot disable self', 'PATCH', f'/api/v1/users/{me["id"]}', 409, {'enabled':False}, admin)

    signup_body = {'email':'audit-signup@example.test','fullName':'Audit Signup','password':'Audit@12345','role':'ADMIN'}
    signup = call('Public signup', 'POST', '/api/v1/auth/signup', body=signup_body)
    check('Signup cannot grant ADMIN through extra property', signup.get('user',{}).get('role') == 'DEVELOPER')
    call('Duplicate signup rejected', 'POST', '/api/v1/auth/signup', 400, signup_body)
    weak = call('Signup should reject one-character password', 'POST', '/api/v1/auth/signup', 400,
                {'email':'audit-weak@example.test','fullName':'Weak Password','password':'x'})
    long_password = 'A1' * 40
    call('Signup should reject passwords over BCrypt 72-byte limit', 'POST', '/api/v1/auth/signup', 400,
         {'email':'audit-long@example.test','fullName':'Long Password','password':long_password})

    app_body = {'name':'audit-service','description':'Disposable API audit service','runtime':'Java 21',
                'ownerTeam':'Audit Team','repoUrl':'audit/service'}
    app_data = call('Register application', 'POST', '/api/v1/applications', 201, app_body, developer)
    app_id = app_data['id']
    call('Duplicate application rejected', 'POST', '/api/v1/applications', 409, app_body, admin)
    call('Invalid application name rejected', 'POST', '/api/v1/applications', 400, {**app_body,'name':'INVALID name'}, admin)
    apps = call('Application search and runtime filters', 'GET', '/api/v1/applications?q=audit-service&runtime=Java%2021&size=1', token=admin)
    check('Application search returns created service', apps.get('totalElements') == 1 and apps['content'][0]['id'] == app_id)
    call('Application statistics', 'GET', '/api/v1/applications/stats', token=admin)
    call('Application details', 'GET', f'/api/v1/applications/{app_id}', token=admin)
    call('Application update', 'PATCH', f'/api/v1/applications/{app_id}', body={'description':'Updated by audit'}, token=devops)
    call('Developer application update denied', 'PATCH', f'/api/v1/applications/{app_id}', 403, {'description':'Denied update'}, developer)
    call('Unknown application returns 404', 'GET', '/api/v1/applications/99999999', 404, token=admin)
    trash = call('Register disposable delete target', 'POST', '/api/v1/applications', 201, {**app_body,'name':'audit-delete'}, admin)
    call('Application delete', 'DELETE', f'/api/v1/applications/{trash["id"]}', 204, token=devops)
    call('Deleted application returns 404', 'GET', f'/api/v1/applications/{trash["id"]}', 404, token=admin)
    envs = call('Environment list', 'GET', '/api/v1/environments', token=admin)
    check('Environment pipeline order', [env['code'] for env in envs] == ['DEV','STAGING','PRODUCTION'])
    call('Environment details', 'GET', '/api/v1/environments/DEV', token=admin)
    call('Dashboard summary with Sri Lanka offset', 'GET', '/api/v1/dashboard/summary?tzOffsetMinutes=330', token=admin)
    stream_test()

    call('Production promotion gate', 'POST', '/api/v1/deployments', 422,
         {'applicationId':app_id,'environment':'PRODUCTION','version':'v1.0.0'}, admin)
    call('Developer production deployment denied', 'POST', '/api/v1/deployments', 403,
         {'applicationId':app_id,'environment':'PRODUCTION','version':'v1.0.0'}, developer)
    call('Non-admin force denied', 'POST', '/api/v1/deployments', 403,
         {'applicationId':app_id,'environment':'DEV','version':'v1.0.0','force':True}, developer)
    call('Invalid deployment version rejected', 'POST', '/api/v1/deployments', 400,
         {'applicationId':app_id,'environment':'DEV','version':'latest'}, admin)
    first = wait_deployment(deploy('v1.0.0', token=developer), 'SUCCEEDED')
    call('Deployment details endpoint', 'GET', f'/api/v1/deployments/{first["id"]}', token=admin)
    call('Finished deployment cannot be cancelled', 'POST', f'/api/v1/deployments/{first["id"]}/cancel', 409, token=admin)
    wait_deployment(deploy('v1.0.0','STAGING',devops), 'SUCCEEDED')
    production = wait_deployment(deploy('v1.0.0','PRODUCTION',devops), 'SUCCEEDED')
    failed = wait_deployment(deploy('v1.0.1-fail','PRODUCTION',force=True), 'FAILED')
    incidents = call('Failed deployment opens incident', 'GET', '/api/v1/incidents?openOnly=true&applicationId=' + str(app_id), token=admin)
    check('Auto incident links failed deployment', any(i.get('deploymentId') == failed['id'] for i in incidents['content']))
    rollback = call('Rollback failed release', 'POST', f'/api/v1/deployments/{failed["id"]}/rollback', 202, {'reason':'Audit rollback'}, admin)
    rolled = wait_deployment(rollback, 'SUCCEEDED')
    check('Rollback restores previous version', rolled.get('version') == 'v1.0.0' and rolled.get('rollbackOfId') == failed['id'])
    build_fail = wait_deployment(deploy('v1.0.2-build-fail'), 'FAILED')
    cancelled = deploy('v1.0.3')
    call('Cancel active deployment', 'POST', f'/api/v1/deployments/{cancelled["id"]}/cancel', token=admin)
    wait_deployment(cancelled, 'CANCELLED')
    call('Deployment list filters', 'GET', f'/api/v1/deployments?applicationId={app_id}&environment=PRODUCTION&status=SUCCEEDED', token=admin)
    logs = call('Deployment logs', 'GET', f'/api/v1/deployments/{production["id"]}/logs', token=admin)
    check('Successful deployment has all pipeline stage logs', {'BUILD','IMAGE','DEPLOY','VERIFY'}.issubset({log['stage'] for log in logs}))

    incident = call('Report incident', 'POST', '/api/v1/incidents', 201,
                    {'title':'Audit synthetic incident','description':'Disposable test','severity':'SEV3','applicationId':app_id,'environment':'DEV'}, developer)
    incident_path = f'/api/v1/incidents/{incident["id"]}'
    call('Incident details', 'GET', incident_path, token=admin)
    call('Developer cannot resolve incident', 'PATCH', incident_path, 403, {'status':'RESOLVED'}, developer)
    assigned = call('Assign and acknowledge incident', 'PATCH', incident_path, body={'status':'ACKNOWLEDGED','assigneeId':role_ids['DEVOPS']}, token=devops)
    check('Acknowledgement sets actor and timestamp', bool(assigned.get('acknowledgedAt')) and assigned.get('assignee',{}).get('id') == role_ids['DEVOPS'])
    resolved = call('Resolve incident', 'PATCH', incident_path, body={'status':'RESOLVED'}, token=devops)
    check('Resolution timestamp persisted', bool(resolved.get('resolvedAt')))
    call('Reopen incident', 'PATCH', incident_path, body={'status':'OPEN','unassign':True}, token=devops)
    call('Incident query filters', 'GET', '/api/v1/incidents?q=Audit&severity=SEV3&status=OPEN', token=admin)

    # Lock a disposable developer user, then unlock it.
    for attempt in range(5):
        call(f'Failed login {attempt + 1}', 'POST', '/api/v1/auth/login', 401,
             {'email':'audit-developer@example.test','password':'wrong-password'})
    call('Locked account rejects correct password', 'POST', '/api/v1/auth/login', (401,423),
         {'email':'audit-developer@example.test','password':'Audit@12345'})
    call('Admin unlocks account', 'POST', f'/api/v1/users/{role_ids["DEVELOPER"]}/unlock', token=admin)
    login('audit-developer@example.test')
    call('Disable user', 'PATCH', f'/api/v1/users/{role_ids["DEVELOPER"]}', body={'enabled':False}, token=admin)
    call('Disabled user cannot login', 'POST', '/api/v1/auth/login', 401,
         {'email':'audit-developer@example.test','password':'Audit@12345'})
    call('Disabled user existing access token should be rejected', 'GET', '/api/v1/applications', (401,403), token=developer)
    call('Re-enable user', 'PATCH', f'/api/v1/users/{role_ids["DEVELOPER"]}', body={'enabled':True}, token=admin)

    rotated = call('Refresh rotates token', 'POST', '/api/v1/auth/refresh', body={'refreshToken':signup['refreshToken']})
    check('Refresh token changes', rotated.get('refreshToken') != signup['refreshToken'])
    call('Refresh reuse rejected', 'POST', '/api/v1/auth/refresh', 401, {'refreshToken':signup['refreshToken']})
    call('Reuse revokes token family', 'POST', '/api/v1/auth/refresh', 401, {'refreshToken':rotated['refreshToken']})
    signup = login(signup_body['email'])
    call('Change own password', 'PUT', '/api/v1/auth/password', 204,
         {'currentPassword':'Audit@12345','newPassword':'Changed@12345'}, signup['accessToken'])
    call('Old password rejected after change', 'POST', '/api/v1/auth/login', 401,
         {'email':signup_body['email'],'password':'Audit@12345'})
    signup = login(signup_body['email'], 'Changed@12345')
    call('Logout', 'POST', '/api/v1/auth/logout', 204, {'refreshToken':signup['refreshToken']})
    call('Logged-out refresh token rejected', 'POST', '/api/v1/auth/refresh', 401, {'refreshToken':signup['refreshToken']})
    signup = login(signup_body['email'], 'Changed@12345')
    call('Logout all sessions', 'POST', '/api/v1/auth/logout-all', 204, token=signup['accessToken'])
    call('Logout-all revokes refresh token', 'POST', '/api/v1/auth/refresh', 401, {'refreshToken':signup['refreshToken']})

    call('Developer audit access denied', 'GET', '/api/v1/audit-events', 403, token=developer)
    audit = call('DevOps audit log access', 'GET', '/api/v1/audit-events?size=200', token=devops)
    actions = {event['action'] for event in audit['content']}
    required_actions = {'SIGNUP','LOGIN','LOGIN_FAILED','ACCOUNT_LOCKED','APPLICATION_CREATED','APPLICATION_UPDATED','APPLICATION_DELETED',
                        'DEPLOYMENT_REQUESTED','DEPLOYMENT_SUCCEEDED','DEPLOYMENT_FAILED','DEPLOYMENT_ROLLBACK','DEPLOYMENT_CANCEL_REQUESTED',
                        'INCIDENT_OPENED','INCIDENT_ACKNOWLEDGED','INCIDENT_RESOLVED','USER_CREATED','USER_UPDATED','PASSWORD_CHANGED','LOGOUT_ALL','TOKEN_REUSE_DETECTED'}
    check('Audit captures expected lifecycle actions', required_actions.issubset(actions), 'Missing: ' + ', '.join(sorted(required_actions - actions)))
    filtered = call('Audit filters by action', 'GET', '/api/v1/audit-events?action=LOGIN_FAILED&size=2', token=admin)
    check('Audit action filtering is accurate', bool(filtered['content']) and all(e['action'] == 'LOGIN_FAILED' for e in filtered['content']))
    searched = call('Audit search, entity and actor filters', 'GET', f'/api/v1/audit-events?entityType=APPLICATION&actorId={role_ids["DEVELOPER"]}&q=audit', token=admin)
    check('Audit actor/entity filters are accurate', bool(searched['content']) and all(e['actorId'] == role_ids['DEVELOPER'] and e['entityType'] == 'APPLICATION' for e in searched['content']))
    check('Audit fields include time actor entity and details', all(all(k in e for k in ('id','actorEmail','action','entityType','createdAt')) for e in audit['content']))
    call('Audit API has no delete operation', 'DELETE', '/api/v1/audit-events/1', (404,405), token=admin)
    call('CORS allows configured frontend', 'OPTIONS', '/api/v1/applications', headers={'Origin':args.proxy,'Access-Control-Request-Method':'GET'})
except Exception as error:
    check('Audit completes without script exception', False, type(error).__name__ + ': ' + str(error)[:150])
finally:
    # Match concrete numeric ids to OpenAPI path variables.
    import re
    def matches(concrete, template):
        return bool(re.fullmatch(re.sub(r'\{[^}]+\}', '[^/]+', template), concrete))
    documented = locals().get('documented', [])
    covered = [(method, path) for method, path in documented if any(m == method and matches(p, path) for m, p in operations)]
    executed_at = datetime.now(timezone(timedelta(hours=5, minutes=30)))
    output = {'date':executed_at.date().isoformat(),'base':args.base,'proxy':args.proxy,'checks':len(results),
              'passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),
              'documentedOperations':len(documented),'exercisedOperations':len(covered),
              'unexercisedOperations':[f'{m.upper()} {p}' for m,p in documented if (m,p) not in covered],
              'results':results}
    target = Path(__file__).with_name('api-results.json')
    target.write_text(json.dumps(output, indent=2) + '\n', encoding='utf-8')
    print(f"Results: {output['passed']}/{output['checks']} passed; {output['failed']} failed. Saved {target.name}.")

raise SystemExit(1 if output['failed'] else 0)
