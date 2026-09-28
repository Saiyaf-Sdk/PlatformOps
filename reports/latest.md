# CI run 1

- ref: `main` · commit: `3263e024644e88b9952dde04220f92aca49fdbe5`
- backend: **failure** · frontend: **success** · docker: **skipped**

## Backend
```
[ERROR] Tests run: 8, Failures: 2, Errors: 0, Skipped: 0, Time elapsed: 16.92 s <<< FAILURE! -- in com.platformops.IncidentUserAuditTest
[ERROR] Tests run: 7, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 4.425 s <<< FAILURE! -- in com.platformops.ApplicationApiTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 3.266 s -- in com.platformops.DemoSeedTest
[ERROR] Tests run: 10, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 7.624 s <<< FAILURE! -- in com.platformops.AuthFlowTest
[ERROR] Tests run: 9, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 9.364 s <<< FAILURE! -- in com.platformops.DeploymentPipelineTest
[ERROR] Tests run: 35, Failures: 5, Errors: 0, Skipped: 0
[INFO] BUILD FAILURE
```
### Errors
```
Resolved Exception:
Resolved Exception:
Resolved Exception:
             Type = com.platformops.common.ApiException
Resolved Exception:
             Type = org.springframework.web.bind.MethodArgumentNotValidException
Resolved Exception:
Resolved Exception:
Resolved Exception:
             Type = org.springframework.web.servlet.resource.NoResourceFoundException
[ERROR] Tests run: 8, Failures: 2, Errors: 0, Skipped: 0, Time elapsed: 16.92 s <<< FAILURE! -- in com.platformops.IncidentUserAuditTest
[ERROR] com.platformops.IncidentUserAuditTest.adminManagesPeopleWithGuardrails -- Time elapsed: 0.975 s <<< FAILURE!
Caused by: com.jayway.jsonpath.PathNotFoundException: Missing property in path $['errors']
[ERROR] com.platformops.IncidentUserAuditTest.healthAndDocsArePublic -- Time elapsed: 0.761 s <<< FAILURE!
java.lang.AssertionError: Status expected:<200> but was:<404>
Resolved Exception:
Resolved Exception:
             Type = org.springframework.web.bind.MethodArgumentNotValidException
[ERROR] Tests run: 7, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 4.425 s <<< FAILURE! -- in com.platformops.ApplicationApiTest
[ERROR] com.platformops.ApplicationApiTest.namesMustBeKubernetesSafe -- Time elapsed: 0.617 s <<< FAILURE!
Caused by: com.jayway.jsonpath.PathNotFoundException: Missing property in path $['errors']
Resolved Exception:
             Type = org.springframework.web.bind.MethodArgumentNotValidException
[ERROR] Tests run: 10, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 7.624 s <<< FAILURE! -- in com.platformops.AuthFlowTest
[ERROR] com.platformops.AuthFlowTest.validationErrorsAreDescriptive -- Time elapsed: 0.013 s <<< FAILURE!
Caused by: com.jayway.jsonpath.PathNotFoundException: No results for path: $['code']
Resolved Exception:
Resolved Exception:
Resolved Exception:
             Type = org.springframework.web.bind.MethodArgumentNotValidException
[ERROR] Tests run: 9, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 9.364 s <<< FAILURE! -- in com.platformops.DeploymentPipelineTest
[ERROR] com.platformops.DeploymentPipelineTest.invalidVersionsAndUnknownAppsAreRejected -- Time elapsed: 0.613 s <<< FAILURE!
Caused by: com.jayway.jsonpath.PathNotFoundException: Missing property in path $['errors']
[ERROR] Failures: 
[ERROR]   ApplicationApiTest.namesMustBeKubernetesSafe:52 No value at JSON path "$.errors.name"
[ERROR]   AuthFlowTest.validationErrorsAreDescriptive:107 No value at JSON path "$.code"
[ERROR]   DeploymentPipelineTest.invalidVersionsAndUnknownAppsAreRejected:136 No value at JSON path "$.errors.version"
[ERROR]   IncidentUserAuditTest.adminManagesPeopleWithGuardrails:67 No value at JSON path "$.errors.password"
[ERROR]   IncidentUserAuditTest.healthAndDocsArePublic:124 Status expected:<200> but was:<404>
[ERROR] Tests run: 35, Failures: 5, Errors: 0, Skipped: 0
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-surefire-plugin:3.5.3:test (default-test) on project platformops-api: There are test failures.
[ERROR] See /home/runner/work/PlatformOps/PlatformOps/Backend/target/surefire-reports for the individual test results.
[ERROR] See dump files (if any exist) [date].dump, [date]-jvmRun[N].dump and [date].dumpstream.
```
### Failing tests
```
-------------------------------------------------------------------------------
Test set: com.platformops.ApplicationApiTest
-------------------------------------------------------------------------------
Tests run: 7, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 4.425 s <<< FAILURE! -- in com.platformops.ApplicationApiTest
com.platformops.ApplicationApiTest.namesMustBeKubernetesSafe -- Time elapsed: 0.617 s <<< FAILURE!
java.lang.AssertionError: No value at JSON path "$.errors.name"
	at org.springframework.test.util.JsonPathExpectationsHelper.evaluateJsonPath(JsonPathExpectationsHelper.java:351)
	at org.springframework.test.util.JsonPathExpectationsHelper.assertExistsAndReturn(JsonPathExpectationsHelper.java:388)
	at org.springframework.test.util.JsonPathExpectationsHelper.exists(JsonPathExpectationsHelper.java:239)
	at org.springframework.test.web.servlet.result.JsonPathResultMatchers.lambda$exists$3(JsonPathResultMatchers.java:124)
	at org.springframework.test.web.servlet.MockMvc$1.andExpect(MockMvc.java:214)
	at com.platformops.ApplicationApiTest.namesMustBeKubernetesSafe(ApplicationApiTest.java:52)
	at java.base/java.lang.reflect.Method.invoke(Method.java:580)
	at java.base/java.util.ArrayList.forEach(ArrayList.java:1596)
	at java.base/java.util.ArrayList.forEach(ArrayList.java:1596)
Caused by: com.jayway.jsonpath.PathNotFoundException: Missing property in path $['errors']

----
-------------------------------------------------------------------------------
Test set: com.platformops.IncidentUserAuditTest
-------------------------------------------------------------------------------
Tests run: 8, Failures: 2, Errors: 0, Skipped: 0, Time elapsed: 16.92 s <<< FAILURE! -- in com.platformops.IncidentUserAuditTest
com.platformops.IncidentUserAuditTest.adminManagesPeopleWithGuardrails -- Time elapsed: 0.975 s <<< FAILURE!
java.lang.AssertionError: No value at JSON path "$.errors.password"
	at org.springframework.test.util.JsonPathExpectationsHelper.evaluateJsonPath(JsonPathExpectationsHelper.java:351)
	at org.springframework.test.util.JsonPathExpectationsHelper.assertExistsAndReturn(JsonPathExpectationsHelper.java:388)
	at org.springframework.test.util.JsonPathExpectationsHelper.exists(JsonPathExpectationsHelper.java:239)
	at org.springframework.test.web.servlet.result.JsonPathResultMatchers.lambda$exists$3(JsonPathResultMatchers.java:124)
	at org.springframework.test.web.servlet.MockMvc$1.andExpect(MockMvc.java:214)
	at com.platformops.IncidentUserAuditTest.adminManagesPeopleWithGuardrails(IncidentUserAuditTest.java:67)
	at java.base/java.lang.reflect.Method.invoke(Method.java:580)
	at java.base/java.util.ArrayList.forEach(ArrayList.java:1596)
	at java.base/java.util.ArrayList.forEach(ArrayList.java:1596)
Caused by: com.jayway.jsonpath.PathNotFoundException: Missing property in path $['errors']

com.platformops.IncidentUserAuditTest.healthAndDocsArePublic -- Time elapsed: 0.761 s <<< FAILURE!
java.lang.AssertionError: Status expected:<200> but was:<404>
	at org.springframework.test.util.AssertionErrors.fail(AssertionErrors.java:61)
	at org.springframework.test.util.AssertionErrors.assertEquals(AssertionErrors.java:128)
	at org.springframework.test.web.servlet.result.StatusResultMatchers.lambda$matcher$9(StatusResultMatchers.java:640)
	at org.springframework.test.web.servlet.MockMvc$1.andExpect(MockMvc.java:214)
	at com.platformops.IncidentUserAuditTest.healthAndDocsArePublic(IncidentUserAuditTest.java:124)
	at java.base/java.lang.reflect.Method.invoke(Method.java:580)
	at java.base/java.util.ArrayList.forEach(ArrayList.java:1596)
	at java.base/java.util.ArrayList.forEach(ArrayList.java:1596)

----
-------------------------------------------------------------------------------
Test set: com.platformops.DeploymentPipelineTest
-------------------------------------------------------------------------------
Tests run: 9, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 9.364 s <<< FAILURE! -- in com.platformops.DeploymentPipelineTest
com.platformops.DeploymentPipelineTest.invalidVersionsAndUnknownAppsAreRejected -- Time elapsed: 0.613 s <<< FAILURE!
java.lang.AssertionError: No value at JSON path "$.errors.version"
	at org.springframework.test.util.JsonPathExpectationsHelper.evaluateJsonPath(JsonPathExpectationsHelper.java:351)
	at org.springframework.test.util.JsonPathExpectationsHelper.assertExistsAndReturn(JsonPathExpectationsHelper.java:388)
	at org.springframework.test.util.JsonPathExpectationsHelper.exists(JsonPathExpectationsHelper.java:239)
	at org.springframework.test.web.servlet.result.JsonPathResultMatchers.lambda$exists$3(JsonPathResultMatchers.java:124)
	at org.springframework.test.web.servlet.MockMvc$1.andExpect(MockMvc.java:214)
	at com.platformops.DeploymentPipelineTest.invalidVersionsAndUnknownAppsAreRejected(DeploymentPipelineTest.java:136)
	at java.base/java.lang.reflect.Method.invoke(Method.java:580)
	at java.base/java.util.ArrayList.forEach(ArrayList.java:1596)
	at java.base/java.util.ArrayList.forEach(ArrayList.java:1596)
Caused by: com.jayway.jsonpath.PathNotFoundException: Missing property in path $['errors']

----
-------------------------------------------------------------------------------
Test set: com.platformops.AuthFlowTest
-------------------------------------------------------------------------------
Tests run: 10, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 7.624 s <<< FAILURE! -- in com.platformops.AuthFlowTest
com.platformops.AuthFlowTest.validationErrorsAreDescriptive -- Time elapsed: 0.013 s <<< FAILURE!
java.lang.AssertionError: No value at JSON path "$.code"
	at org.springframework.test.util.JsonPathExpectationsHelper.evaluateJsonPath(JsonPathExpectationsHelper.java:351)
	at org.springframework.test.util.JsonPathExpectationsHelper.assertValue(JsonPathExpectationsHelper.java:148)
	at org.springframework.test.web.servlet.result.JsonPathResultMatchers.lambda$value$2(JsonPathResultMatchers.java:112)
	at org.springframework.test.web.servlet.MockMvc$1.andExpect(MockMvc.java:214)
	at com.platformops.AuthFlowTest.validationErrorsAreDescriptive(AuthFlowTest.java:107)
	at java.base/java.lang.reflect.Method.invoke(Method.java:580)
	at java.base/java.util.ArrayList.forEach(ArrayList.java:1596)
	at java.base/java.util.ArrayList.forEach(ArrayList.java:1596)
Caused by: com.jayway.jsonpath.PathNotFoundException: No results for path: $['code']

----
```
## Frontend
```

> frontend@0.0.0 build
> tsc -b && vite build

[36mvite v8.3.1 [32mbuilding client environment for production...[36m[39m
transforming...
✓ 2554 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                                          0.89 kB │ gzip:   0.53 kB
dist/assets/jetbrains-mono-vietnamese-wght-normal-Bt-aOZkq.woff2         7.50 kB
dist/assets/plus-jakarta-sans-vietnamese-wght-normal-qRpaaN48.woff2      8.35 kB
dist/assets/jetbrains-mono-greek-wght-normal-Bw9x6K1M.woff2              9.00 kB
dist/assets/jetbrains-mono-cyrillic-wght-normal-D73BlboJ.woff2          12.10 kB
dist/assets/bricolage-grotesque-vietnamese-opsz-normal-D9N6E8K1.woff2   12.98 kB
dist/assets/jetbrains-mono-latin-ext-wght-normal-DBQx-q_a.woff2         15.19 kB
dist/assets/plus-jakarta-sans-latin-ext-wght-normal-DmpS2jIq.woff2      21.72 kB
dist/assets/plus-jakarta-sans-latin-wght-normal-eXO_dkmS.woff2          27.34 kB
dist/assets/bricolage-grotesque-latin-ext-opsz-normal-IcJDqblK.woff2    30.73 kB
dist/assets/jetbrains-mono-latin-wght-normal-B9CIFXIH.woff2             40.40 kB
dist/assets/bricolage-grotesque-latin-opsz-normal-Cre6nC2_.woff2        76.88 kB
dist/assets/index-Bo-ib1tq.css                                          43.39 kB │ gzip:  13.35 kB
dist/assets/index-C4hUBHNU.js                                          959.28 kB │ gzip: 282.06 kB

[33m[plugin builtin:vite-reporter] 
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.[39m
[32m✓ built in 1.14s[39m
```
