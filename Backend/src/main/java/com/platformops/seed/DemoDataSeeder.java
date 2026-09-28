package com.platformops.seed;

import com.platformops.app.AppStatus;
import com.platformops.app.Application;
import com.platformops.app.ApplicationRepository;
import com.platformops.config.AppProperties;
import com.platformops.deployment.*;
import com.platformops.environment.Environment;
import com.platformops.environment.EnvironmentCode;
import com.platformops.environment.EnvironmentRepository;
import com.platformops.environment.EnvironmentStatus;
import com.platformops.incident.Incident;
import com.platformops.incident.IncidentRepository;
import com.platformops.incident.IncidentStatus;
import com.platformops.incident.Severity;
import com.platformops.user.Role;
import com.platformops.user.User;
import com.platformops.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Fills an EMPTY database with a believable month of platform history so the UI has
 * something real to show. Never touches a database that already has users.
 * Disable with SEED_DEMO_DATA=false (the prod profile disables it by default).
 */
@Component
@Order(10)
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);
    public static final String ADMIN_EMAIL = "admin@platformops.dev";
    public static final String ADMIN_PASSWORD = "Admin@12345";
    public static final String DEMO_PASSWORD = "Demo@12345";

    private final AppProperties props;
    private final UserRepository users;
    private final ApplicationRepository apps;
    private final EnvironmentRepository envs;
    private final DeploymentRepository deployments;
    private final DeploymentLogRepository logs;
    private final IncidentRepository incidents;
    private final PasswordEncoder encoder;
    private final Clock clock;

    public DemoDataSeeder(AppProperties props, UserRepository users, ApplicationRepository apps, EnvironmentRepository envs,
                          DeploymentRepository deployments, DeploymentLogRepository logs, IncidentRepository incidents,
                          PasswordEncoder encoder, Clock clock) {
        this.props = props;
        this.users = users;
        this.apps = apps;
        this.envs = envs;
        this.deployments = deployments;
        this.logs = logs;
        this.incidents = incidents;
        this.encoder = encoder;
        this.clock = clock;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!props.seed().enabled() || users.count() > 0) return;
        log.info("Empty database: seeding demo data (disable with SEED_DEMO_DATA=false)");

        Random rnd = new Random(42);
        Instant now = clock.instant();

        String demoHash = encoder.encode(DEMO_PASSWORD);
        User admin = users.save(new User(ADMIN_EMAIL, "Admin User", encoder.encode(ADMIN_PASSWORD), Role.ADMIN));
        User nimal = users.save(new User("nimal@platformops.dev", "Nimal Perera", demoHash, Role.DEVOPS));
        User aisha = users.save(new User("aisha@platformops.dev", "Aisha Khan", demoHash, Role.DEVELOPER));
        User kavin = users.save(new User("kavin@platformops.dev", "Kavin Raj", demoHash, Role.DEVOPS));
        User sara = users.save(new User("sara@platformops.dev", "Sara Fernando", demoHash, Role.DEVELOPER));
        users.save(new User("ravi@platformops.dev", "Ravi Silva", demoHash, Role.VIEWER));
        List<User> deployers = List.of(admin, nimal, aisha, kavin, sara);

        Environment dev = envs.findByCode(EnvironmentCode.DEV).orElseThrow();
        Environment staging = envs.findByCode(EnvironmentCode.STAGING).orElseThrow();
        Environment prod = envs.findByCode(EnvironmentCode.PRODUCTION).orElseThrow();

        record Spec(String name, String desc, String runtime, String team, String[] versions) {}
        List<Spec> specs = List.of(
                new Spec("payment-gateway", "Core payment processing microservice", "Java 21 / Spring Boot", "Fintech Squad", new String[]{"v1.6.2", "v1.7.0", "v1.7.1", "v1.8.0"}),
                new Spec("auth-service", "JWT authentication & authorization", "Go 1.22", "Platform Team", new String[]{"v3.1.0", "v3.1.4", "v3.2.0", "v3.2.1"}),
                new Spec("frontend-dashboard", "React SPA for the customer portal", "Node 20 / React", "Web Team", new String[]{"v4.9.0", "v5.0.0", "v5.1.0", "v5.1.2"}),
                new Spec("inventory-worker", "Async inventory sync worker", "Python 3.12", "Data Team", new String[]{"v2.0.1", "v2.0.2", "v2.0.3", "v2.0.4"}),
                new Spec("notification-svc", "Multi-channel notification dispatcher", "Node 20", "Platform Team", new String[]{"v1.1.0", "v1.2.0", "v1.2.3", "v1.3.0"}),
                new Spec("analytics-engine", "Real-time metrics aggregation", "Python 3.12", "Data Team", new String[]{"v0.9.0", "v0.9.5", "v0.9.8", "v1.0.0"}));

        int[] build = {1200};
        List<Deployment> created = new ArrayList<>();
        Map<String, Application> byName = new java.util.HashMap<>();

        for (Spec s : specs) {
            Application a = apps.save(new Application(s.name(), s.desc(), s.runtime(), s.team(), "org/" + s.name()));
            byName.put(s.name(), a);
            // releases spread over the last ~26 days, each promoted dev → staging → prod
            for (int r = 0; r < s.versions().length; r++) {
                String v = s.versions()[r];
                boolean latest = r == s.versions().length - 1;
                Instant releaseDay = now.minus(Duration.ofDays(26 - r * 7L - rnd.nextInt(3))).minus(Duration.ofMinutes(rnd.nextInt(600)));
                if (latest) releaseDay = now.minus(Duration.ofHours(30 + rnd.nextInt(20)));
                User who = deployers.get(rnd.nextInt(deployers.size()));
                created.add(record(a, dev, v, who, releaseDay, DeploymentStatus.SUCCEEDED, null, build, rnd));
                created.add(record(a, staging, v, who, releaseDay.plus(Duration.ofHours(3 + rnd.nextInt(4))), DeploymentStatus.SUCCEEDED, null, build, rnd));
                boolean failProd = latest && s.name().equals("inventory-worker");
                Instant prodAt = latest
                        ? now.minus(Duration.ofMinutes(switch (s.name()) {
                            case "auth-service" -> 14; case "inventory-worker" -> 31; case "frontend-dashboard" -> 64;
                            case "payment-gateway" -> 118; case "notification-svc" -> 184; default -> 300; }))
                        : releaseDay.plus(Duration.ofHours(20 + rnd.nextInt(10)));
                User promoter = rnd.nextBoolean() ? nimal : kavin;
                created.add(record(a, prod, v, promoter, prodAt,
                        failProd ? DeploymentStatus.FAILED : DeploymentStatus.SUCCEEDED,
                        failProd ? "Health checks failed after rollout — smoke tests returned 503" : null, build, rnd));
            }
            // day-to-day dev churn
            int churn = 10 + rnd.nextInt(14);
            for (int i = 0; i < churn; i++) {
                String base = s.versions()[s.versions().length - 1];
                Instant at = now.minus(Duration.ofMinutes(30 + rnd.nextInt(27 * 24 * 60)));
                DeploymentStatus st = rnd.nextInt(12) == 0 ? DeploymentStatus.FAILED : DeploymentStatus.SUCCEEDED;
                created.add(record(a, rnd.nextInt(4) == 0 ? staging : dev, base + "-dev." + (i + 1), deployers.get(rnd.nextInt(deployers.size())),
                        at, st, st == DeploymentStatus.FAILED ? "Build agent ran out of disk space" : null, build, rnd));
            }
            String[] vs = s.versions();
            String prodVersion = s.name().equals("inventory-worker") ? vs[vs.length - 2] : vs[vs.length - 1];
            a.setCurrentVersion(prodVersion);
            a.setLastDeployedAt(now.minus(Duration.ofMinutes(20)));
        }

        byName.get("inventory-worker").setStatus(AppStatus.CRITICAL);
        byName.get("frontend-dashboard").setStatus(AppStatus.WARNING);

        // environments reflect their latest successful rollout
        for (Environment e : List.of(dev, staging, prod)) {
            created.stream().filter(d -> d.getEnvironment() == e && d.getStatus() == DeploymentStatus.SUCCEEDED)
                    .max(java.util.Comparator.comparing(Deployment::getCreatedAt))
                    .ifPresent(d -> { e.setCurrentVersion(d.getReleaseVersion()); e.setLastDeployedAt(d.getFinishedAt()); });
        }
        dev.setHealthScore(96); dev.setPodsRunning(24);
        staging.setHealthScore(99); staging.setPodsRunning(18);
        prod.setHealthScore(96); prod.setPodsRunning(48); prod.setStatus(EnvironmentStatus.DEGRADED);

        // incidents: one live SEV2 from the failed rollout, one being worked, a few resolved
        Deployment failed = created.stream()
                .filter(d -> d.getStatus() == DeploymentStatus.FAILED && d.getEnvironment() == prod).findFirst().orElse(null);
        incidents.save(new Incident("Production deployment failed: inventory-worker v2.0.4",
                "Health checks failed after rollout — smoke tests returned 503.\n\nOpened automatically by the release pipeline. Consider rolling back.",
                Severity.SEV2, byName.get("inventory-worker"), prod, failed, null, now.minus(Duration.ofMinutes(30))));
        Incident ack = new Incident("Elevated 5xx on customer portal",
                "Error rate on /api/orders climbed to 3.1% after the CDN config change.", Severity.SEV3,
                byName.get("frontend-dashboard"), prod, null, sara, now.minus(Duration.ofMinutes(55)));
        ack.setStatus(IncidentStatus.ACKNOWLEDGED);
        ack.setAssignee(sara);
        ack.setAcknowledgedAt(now.minus(Duration.ofMinutes(48)));
        incidents.save(ack);
        resolved("Payment webhooks delayed", Severity.SEV2, byName.get("payment-gateway"), prod, nimal, now.minus(Duration.ofDays(3)), Duration.ofMinutes(42));
        resolved("Staging database connection pool exhausted", Severity.SEV3, byName.get("analytics-engine"), staging, kavin, now.minus(Duration.ofDays(6)), Duration.ofMinutes(95));
        resolved("Login latency spike (p95 > 2s)", Severity.SEV2, byName.get("auth-service"), prod, nimal, now.minus(Duration.ofDays(11)), Duration.ofMinutes(27));
        resolved("Notification emails sent twice", Severity.SEV4, byName.get("notification-svc"), prod, aisha, now.minus(Duration.ofDays(17)), Duration.ofHours(5));

        log.info("Seeded {} users, {} applications, {} deployments. Sign in as {} / {}", users.count(), apps.count(),
                deployments.count(), ADMIN_EMAIL, ADMIN_PASSWORD);
    }

    private Deployment record(Application a, Environment e, String version, User who, Instant at, DeploymentStatus status,
                              String failure, int[] build, Random rnd) {
        Instant now = clock.instant();
        if (at.isAfter(now)) at = now.minusSeconds(60);
        Deployment d = new Deployment(a, e, version, who, null, null, at);
        d.setStatus(status);
        d.setBuildNumber(++build[0]);
        byte[] sha = new byte[20];
        rnd.nextBytes(sha);
        d.setCommitSha(HexFormat.of().formatHex(sha));
        d.setStartedAt(at.plusSeconds(2));
        Instant end = at.plusSeconds(55 + rnd.nextInt(180));
        d.setFinishedAt(end.isAfter(now) ? now : end);
        if (status == DeploymentStatus.SUCCEEDED) {
            d.setProgress(100);
            d.setCurrentStage(PipelineStage.VERIFY);
            d.setImageUri("123456789012.dkr.ecr.ap-south-1.amazonaws.com/" + a.getName() + ":" + version);
        } else {
            d.setProgress(90);
            d.setCurrentStage(failure != null && failure.startsWith("Build") ? PipelineStage.BUILD : PipelineStage.VERIFY);
            d.setFailureReason(failure);
        }
        d = deployments.save(d);
        // detailed logs only for the most recent ones (keeps the seed small)
        if (Duration.between(at, now).toHours() < 36) {
            Instant t = d.getStartedAt();
            logs.save(new DeploymentLog(d.getId(), PipelineStage.BUILD, DeploymentLog.Level.INFO, "▶ " + PipelineStage.BUILD.label(), t));
            logs.save(new DeploymentLog(d.getId(), PipelineStage.BUILD, DeploymentLog.Level.INFO, "Jenkins job " + a.getName() + " #" + d.getBuildNumber() + " started", t.plusSeconds(1)));
            logs.save(new DeploymentLog(d.getId(), PipelineStage.BUILD, DeploymentLog.Level.INFO, "412 tests passed · coverage 81.4%", t.plusSeconds(20)));
            logs.save(new DeploymentLog(d.getId(), PipelineStage.IMAGE, DeploymentLog.Level.INFO, "Pushed " + a.getName() + ":" + version + " to ECR", t.plusSeconds(35)));
            logs.save(new DeploymentLog(d.getId(), PipelineStage.DEPLOY, DeploymentLog.Level.INFO, "deployment/" + a.getName() + " rolled out on " + e.getCluster(), t.plusSeconds(60)));
            if (status == DeploymentStatus.FAILED) {
                logs.save(new DeploymentLog(d.getId(), PipelineStage.VERIFY, DeploymentLog.Level.ERROR, "✖ " + failure, t.plusSeconds(80)));
            } else {
                logs.save(new DeploymentLog(d.getId(), PipelineStage.VERIFY, DeploymentLog.Level.INFO, "✔ Deployment succeeded", t.plusSeconds(80)));
            }
        }
        return d;
    }

    private void resolved(String title, Severity sev, Application a, Environment e, User owner, Instant at, Duration took) {
        Incident i = new Incident(title, null, sev, a, e, null, owner, at);
        i.setAssignee(owner);
        i.setStatus(IncidentStatus.RESOLVED);
        i.setAcknowledgedAt(at.plus(Duration.ofMinutes(4)));
        i.setResolvedAt(at.plus(took));
        incidents.save(i);
    }
}
