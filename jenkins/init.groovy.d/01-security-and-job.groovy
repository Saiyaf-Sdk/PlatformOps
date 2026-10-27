import jenkins.model.*
import hudson.security.*
import hudson.security.csrf.DefaultCrumbIssuer
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition
import hudson.plugins.git.GitSCM
import hudson.plugins.git.BranchSpec
import hudson.plugins.git.UserRemoteConfig

def instance = Jenkins.getInstance()

// 1. Security Realm (Admin User Authentication)
def realm = new HudsonPrivateSecurityRealm(false)
def adminUser = realm.createAccount("admin", "Admin@PlatformOps2026")
instance.setSecurityRealm(realm)

// 2. Authorization Strategy (Full Control Once Logged In, Anonymous Access Disabled)
def strategy = new FullControlOnceLoggedInAuthorizationStrategy()
strategy.setAllowAnonymousRead(false)
instance.setAuthorizationStrategy(strategy)

// 3. CSRF Protection (Crumb Issuer)
instance.setCrumbIssuer(new DefaultCrumbIssuer(true))

// 4. Configure Jenkins System Root URL
def jlc = JenkinsLocationConfiguration.get()
jlc.setUrl("http://localhost:8088/")
jlc.save()

// 5. Automated Pipeline Job Provisioning
def jobName = "PlatformOps-CI-CD"
if (instance.getItem(jobName) == null) {
    WorkflowJob job = instance.createProject(WorkflowJob.class, jobName)
    def gitRepo = "https://github.com/msajath/PlatformOps.git"
    def branch = "*/main"
    def scm = new GitSCM([new UserRemoteConfig(gitRepo, null, null, null)],
                         [new BranchSpec(branch)],
                         false, Collections.emptyList(), null, null, Collections.emptyList())
    def flowDefinition = new CpsScmFlowDefinition(scm, "Jenkinsfile")
    flowDefinition.setLightweight(true)
    job.setDefinition(flowDefinition)
    job.save()
    println "--> Automated Job '${jobName}' successfully created."
}

instance.save()
println "--> Jenkins security, CSRF protection, and admin configuration successfully initialized."
