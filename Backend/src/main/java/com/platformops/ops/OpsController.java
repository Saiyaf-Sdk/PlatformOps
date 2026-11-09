package com.platformops.ops;

import com.platformops.app.*;
import com.platformops.audit.*;
import com.platformops.common.*;
import com.platformops.deployment.*;
import com.platformops.environment.*;
import com.platformops.incident.*;
import com.platformops.security.CurrentUser;
import com.platformops.user.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.time.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1")
public class OpsController {
    private final InfrastructureRequestRepository requests;
    private final ApplicationRepository apps;
    private final UserRepository users;
    private final AuditService audit;
    private final AuditEventRepository auditRepo;
    private final EnvironmentService environments;
    private final DataSource database;
    private final RequestMetrics metrics;
    private final JdbcTemplate jdbc;
    public OpsController(InfrastructureRequestRepository requests, ApplicationRepository apps, UserRepository users,
                         AuditService audit, AuditEventRepository auditRepo, EnvironmentService environments,
                         DataSource database, RequestMetrics metrics, JdbcTemplate jdbc) {
        this.requests=requests; this.apps=apps; this.users=users; this.audit=audit; this.auditRepo=auditRepo;
        this.environments=environments; this.database=database; this.metrics=metrics; this.jdbc=jdbc;
    }
    public record CreateRequest(@NotNull Long applicationId, @NotNull EnvironmentCode environment,
                                @NotNull InfrastructureRequest.ResourceType resourceType,
                                @NotNull InfrastructureRequest.ResourceSize resourceSize,
                                @NotBlank @Size(min=10,max=2000) String justification) {}
    public record Decision(@Size(max=500) String note) {}
    public record ResourceRequest(Long id, String reference, ApplicationDtos.AppRef application, EnvironmentCode environment,
                                  InfrastructureRequest.ResourceType resourceType, InfrastructureRequest.ResourceSize resourceSize,
                                  String justification, InfrastructureRequest.Status status, UserDtos.UserRef requestedBy,
                                  UserDtos.UserRef reviewedBy, String decisionNote, Instant createdAt, Instant reviewedAt) {
        static ResourceRequest from(InfrastructureRequest r) {
            return new ResourceRequest(r.id,"REQ-"+r.id,ApplicationDtos.AppRef.from(r.application),r.environment,r.resourceType,r.resourceSize,
                    r.justification,r.status,UserDtos.UserRef.from(r.requestedBy),UserDtos.UserRef.from(r.reviewedBy),r.decisionNote,r.createdAt,r.reviewedAt);
        }
    }
    @GetMapping("/infrastructure-requests") @Transactional(readOnly=true)
    public PageResponse<ResourceRequest> list(@RequestParam(required=false) InfrastructureRequest.Status status,
                                             @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="25") int size) {
        var me=CurrentUser.require();
        Specification<InfrastructureRequest> spec=Specification.where(Specs.eq("status",status));
        if (me.role()==Role.DEVELOPER) spec=spec.and(Specs.eqPath("requestedBy","id",me.id()));
        return PageResponse.of(requests.findAll(spec,Pages.of(page,size,Sort.by(Sort.Direction.DESC,"id"))),ResourceRequest::from);
    }
    @PostMapping("/infrastructure-requests") @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','DEVOPS','DEVELOPER')") @Transactional
    public ResourceRequest create(@Valid @RequestBody CreateRequest input) {
        var app=apps.findById(input.applicationId()).orElseThrow(()->ApiException.notFound("Application",input.applicationId()));
        InfrastructureRequest r=new InfrastructureRequest(); r.application=app; r.environment=input.environment();
        r.resourceType=input.resourceType(); r.resourceSize=input.resourceSize(); r.justification=input.justification().trim();
        if(r.justification.length()<10) throw ApiException.badRequest("justification_required","Explain why the resource is needed (at least 10 characters)");
        r.requestedBy=users.getReferenceById(CurrentUser.require().id()); r.createdAt=Instant.now(); requests.saveAndFlush(r);
        audit.record("INFRASTRUCTURE_REQUESTED","INFRASTRUCTURE_REQUEST",r.id,app.getName()+": "+r.resourceType+" on "+r.environment);
        return ResourceRequest.from(r);
    }
    @PostMapping("/infrastructure-requests/{id}/{decision:approve|reject}")
    @PreAuthorize("hasAnyRole('ADMIN','DEVOPS')") @Transactional
    public ResourceRequest decide(@PathVariable Long id,@PathVariable String decision,@Valid @RequestBody Decision input) {
        var r=requests.findById(id).orElseThrow(()->ApiException.notFound("Request",id));
        if(r.status!=InfrastructureRequest.Status.PENDING) throw ApiException.conflict("already_reviewed","This request has already been reviewed");
        if("reject".equals(decision) && (input.note()==null || input.note().isBlank())) throw ApiException.badRequest("reason_required","Give a reason for rejection");
        r.status="approve".equals(decision)?InfrastructureRequest.Status.APPROVED:InfrastructureRequest.Status.REJECTED;
        r.reviewedBy=users.getReferenceById(CurrentUser.require().id()); r.reviewedAt=Instant.now(); r.decisionNote=Texts.blankToNull(input.note());
        requests.saveAndFlush(r); audit.record("INFRASTRUCTURE_"+r.status,"INFRASTRUCTURE_REQUEST",r.id,r.application.getName()+": "+(r.decisionNote==null?r.status:r.decisionNote));
        return ResourceRequest.from(r);
    }
    public record Resource(String id,String name,String type,String status,String details) {}
    @GetMapping("/infrastructure")
    public Map<String,Object> infrastructure() {
        boolean healthy=databaseHealthy();
        return Map.of("resources",List.of(new Resource("api","PlatformOps API","Spring Boot process","HEALTHY","Uptime "+ManagementFactory.getRuntimeMXBean().getUptime()/1000+" seconds"),
                new Resource("database","PlatformOps database","PostgreSQL connection",healthy?"HEALTHY":"DOWN",healthy?"Connection validation succeeded":"Database connection unavailable")),
                "environments",environments.list(),"measuredAt",Instant.now(),"scope","Current local application; deployment environment health is simulated");
    }
    private boolean databaseHealthy() { try(var c=database.getConnection()){return c.isValid(2);}catch(Exception e){return false;} }
    @GetMapping("/monitoring")
    public Map<String,Object> monitoring() {
        var memory=ManagementFactory.getMemoryMXBean().getHeapMemoryUsage();
        var os=ManagementFactory.getOperatingSystemMXBean();
        double cpu=os instanceof com.sun.management.OperatingSystemMXBean bean?bean.getProcessCpuLoad():-1;
        Map<String,Object> value=new LinkedHashMap<>();
        value.put("source","Measured from this API process and its database connection"); value.put("requests",metrics.measurement());
        value.put("heapUsedBytes",memory.getUsed()); value.put("heapMaxBytes",memory.getMax()); value.put("cpuPercent",cpu<0?null:cpu*100);
        value.put("uptimeSeconds",ManagementFactory.getRuntimeMXBean().getUptime()/1000); value.put("databaseHealthy",databaseHealthy());
        value.put("measuredAt",Instant.now()); return value;
    }
    public record SearchResult(String type,String title,String description,String href) {}
    @GetMapping("/search") @Transactional(readOnly=true)
    public List<SearchResult> search(@RequestParam(defaultValue="") @Size(max=100) String q) {
        if(q.isBlank()) return List.of();
        List<SearchResult> found=new ArrayList<>();
        apps.findAll(Specs.<Application>containsAny(q,"name","description","ownerTeam"),PageRequest.of(0,10)).forEach(a->found.add(new SearchResult("Application",a.getName(),a.getOwnerTeam(),"/applications/"+a.getId())));
        jdbc.query("SELECT id,title,status FROM incidents WHERE LOWER(title) LIKE ? ORDER BY id DESC FETCH FIRST 10 ROWS ONLY",(rs,row)->new SearchResult("Incident",rs.getString("title"),rs.getString("status"),"/incidents"),"%"+q.toLowerCase(Locale.ROOT).replace("%","\\%")+"%").forEach(found::add);
        return found;
    }
    public record Notice(Long id,String title,String details,String href,Instant at,boolean read) {}
    @GetMapping("/notifications") @Transactional(readOnly=true)
    public List<Notice> notifications() {
        Long me=CurrentUser.require().id();
        Set<Long> read=new HashSet<>(jdbc.queryForList("SELECT event_id FROM notification_reads WHERE user_id=?",Long.class,me));
        return auditRepo.findAll((root,cq,cb)->cb.and(root.get("entityType").in("DEPLOYMENT","INCIDENT")),PageRequest.of(0,20,Sort.by(Sort.Direction.DESC,"id")))
                .stream().map(e->new Notice(e.getId(),e.getAction().toLowerCase(Locale.ROOT).replace('_',' '),e.getDetails(),"DEPLOYMENT".equals(e.getEntityType())?"/deployments?focus="+e.getEntityId():"/incidents",e.getCreatedAt(),read.contains(e.getId()))).toList();
    }
    @PostMapping("/notifications/read") @Transactional
    public void readNotifications() {
        Long me=CurrentUser.require().id();
        for(var n:notifications()) if(!n.read()) jdbc.update("INSERT INTO notification_reads(user_id,event_id) SELECT ?,? WHERE NOT EXISTS (SELECT 1 FROM notification_reads WHERE user_id=? AND event_id=?)",me,n.id(),me,n.id());
    }
}
