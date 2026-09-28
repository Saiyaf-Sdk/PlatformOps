package com.platformops.audit;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "audit_events")
public class AuditEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_id")
    private Long actorId;

    @Column(name = "actor_email", length = 254)
    private String actorEmail;

    @Column(nullable = false, length = 60)
    private String action;

    @Column(name = "entity_type", nullable = false, length = 40)
    private String entityType;

    @Column(name = "entity_id", length = 64)
    private String entityId;

    @Column(length = 2000)
    private String details;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected AuditEvent() {}

    public AuditEvent(Long actorId, String actorEmail, String action, String entityType, String entityId,
                      String details, String ipAddress, Instant createdAt) {
        this.actorId = actorId;
        this.actorEmail = actorEmail;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.details = details;
        this.ipAddress = ipAddress;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getActorId() { return actorId; }
    public String getActorEmail() { return actorEmail; }
    public String getAction() { return action; }
    public String getEntityType() { return entityType; }
    public String getEntityId() { return entityId; }
    public String getDetails() { return details; }
    public String getIpAddress() { return ipAddress; }
    public Instant getCreatedAt() { return createdAt; }
}
