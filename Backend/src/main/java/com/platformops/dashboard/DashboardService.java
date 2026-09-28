package com.platformops.dashboard;

import com.platformops.app.AppStatus;
import com.platformops.app.ApplicationRepository;
import com.platformops.deployment.DeploymentDtos.DeploymentResponse;
import com.platformops.deployment.DeploymentRepository;
import com.platformops.deployment.DeploymentStatus;
import com.platformops.environment.EnvironmentService;
import com.platformops.environment.EnvironmentService.EnvironmentResponse;
import com.platformops.incident.IncidentRepository;
import com.platformops.incident.IncidentStatus;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class DashboardService {

    public record Kpis(long applications, long healthyApplications, int healthyPercent, long degradedApplications,
                       long deploysToday, long deploysYesterday, long activeDeployments,
                       long openIncidents, long unassignedIncidents) {}

    public record DayCount(LocalDate date, long count) {}

    public record Summary(Kpis kpis, List<DayCount> deployVolume, long deployVolumeTotal, int deployVolumeChangePercent,
                          List<EnvironmentResponse> environments, List<DeploymentResponse> recentDeployments,
                          Instant generatedAt) {}

    private final ApplicationRepository apps;
    private final DeploymentRepository deployments;
    private final IncidentRepository incidents;
    private final EnvironmentService envs;
    private final Clock clock;

    public DashboardService(ApplicationRepository apps, DeploymentRepository deployments, IncidentRepository incidents,
                            EnvironmentService envs, Clock clock) {
        this.apps = apps;
        this.deployments = deployments;
        this.incidents = incidents;
        this.envs = envs;
        this.clock = clock;
    }

    /** Day boundaries are UTC; pass the browser's offset (minutes east of UTC) to get local days. */
    @Transactional(readOnly = true)
    public Summary summary(int tzOffsetMinutes) {
        ZoneOffset zone = ZoneOffset.ofTotalSeconds(Math.max(-14 * 3600, Math.min(14 * 3600, tzOffsetMinutes * 60)));
        Instant now = clock.instant();
        LocalDate today = LocalDate.ofInstant(now, zone);
        Instant startToday = today.atStartOfDay(zone).toInstant();
        Instant startYesterday = today.minusDays(1).atStartOfDay(zone).toInstant();

        long total = apps.count();
        long healthy = apps.countByStatus(AppStatus.HEALTHY);
        long degraded = total - healthy;
        int healthyPct = total == 0 ? 100 : (int) Math.round(healthy * 100.0 / total);
        var openStatuses = EnumSet.of(IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED);

        Kpis kpis = new Kpis(total, healthy, healthyPct, degraded,
                deployments.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(startToday, now.plusSeconds(1)),
                deployments.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(startYesterday, startToday),
                deployments.countByStatusIn(EnumSet.of(DeploymentStatus.QUEUED, DeploymentStatus.RUNNING)),
                incidents.countByStatusIn(openStatuses),
                incidents.countByStatusInAndAssigneeIsNull(openStatuses));

        // 28 days of data: last 14 for the chart, the 14 before for the % change
        LocalDate firstDay = today.minusDays(27);
        Map<LocalDate, Long> perDay = new TreeMap<>();
        for (int i = 0; i < 28; i++) perDay.put(firstDay.plusDays(i), 0L);
        for (Instant t : deployments.createdSince(firstDay.atStartOfDay(zone).toInstant())) {
            perDay.computeIfPresent(LocalDate.ofInstant(t, zone), (k, v) -> v + 1);
        }
        List<DayCount> all = perDay.entrySet().stream().map(e -> new DayCount(e.getKey(), e.getValue())).toList();
        List<DayCount> last14 = new ArrayList<>(all.subList(14, 28));
        long cur = last14.stream().mapToLong(DayCount::count).sum();
        long prev = all.subList(0, 14).stream().mapToLong(DayCount::count).sum();
        int change = prev == 0 ? (cur > 0 ? 100 : 0) : (int) Math.round((cur - prev) * 100.0 / prev);

        List<DeploymentResponse> recent = deployments.findAll((Specification<com.platformops.deployment.Deployment>) (r, q, cb) -> cb.conjunction(),
                        PageRequest.of(0, 8, Sort.by(Sort.Direction.DESC, "createdAt", "id")))
                .map(DeploymentResponse::from).getContent();

        return new Summary(kpis, last14, cur, change, envs.list(), recent, now);
    }
}
