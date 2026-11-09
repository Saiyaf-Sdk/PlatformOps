package com.platformops.ops;

import com.platformops.app.Application;
import com.platformops.environment.EnvironmentCode;
import com.platformops.user.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "infrastructure_requests")
public class InfrastructureRequest {
    public enum ResourceType { DATABASE, CACHE, STORAGE, SERVICE }
    public enum ResourceSize { SMALL, STANDARD, LARGE }
    public enum Status { PENDING, APPROVED, REJECTED }
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "application_id") Application application;
    @Enumerated(EnumType.STRING) @Column(nullable = false) EnvironmentCode environment;
    @Enumerated(EnumType.STRING) @Column(name = "resource_type", nullable = false, length = 30) ResourceType resourceType;
    @Enumerated(EnumType.STRING) @Column(name = "resource_size", nullable = false, length = 20) ResourceSize resourceSize;
    @Column(nullable = false, length = 2000) String justification;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) Status status = Status.PENDING;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "requested_by_id") User requestedBy;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "reviewed_by_id") User reviewedBy;
    @Column(name = "decision_note", length = 500) String decisionNote;
    @Column(name = "created_at", nullable = false) Instant createdAt;
    @Column(name = "reviewed_at") Instant reviewedAt;
    @Version long version;
    protected InfrastructureRequest() {}
}
