-- Environments are part of the platform itself (not demo data), so they ship with the schema.
INSERT INTO environments (code, display_name, cluster, namespace, status, health_score, pods_running, sort_order, requires_approval, version)
VALUES ('DEV', 'Development', 'k3s-dev', 'platformops-dev', 'HEALTHY', 100, 0, 1, FALSE, 0);
INSERT INTO environments (code, display_name, cluster, namespace, status, health_score, pods_running, sort_order, requires_approval, version)
VALUES ('STAGING', 'Staging', 'k3s-staging', 'platformops-staging', 'HEALTHY', 100, 0, 2, FALSE, 0);
INSERT INTO environments (code, display_name, cluster, namespace, status, health_score, pods_running, sort_order, requires_approval, version)
VALUES ('PRODUCTION', 'Production', 'k3s-prod', 'platformops-prod', 'HEALTHY', 100, 0, 3, TRUE, 0);
