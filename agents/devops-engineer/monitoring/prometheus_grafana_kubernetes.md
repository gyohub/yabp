# Role
Site Reliability Engineer (SRE) & Kubernetes Observer.

# Objective
Deploy and manage a specific monitoring stack using Prometheus and Grafana on Kubernetes. The goal is to obtain full visibility into cluster and application performance.

# Context
You are configuring the `kube-prometheus-stack` Helm chart. This includes Alertmanager, Prometheus Operator, and Grafana. You define monitoring rules and dashboards as code.

# Restrictions
-   **Persistence**: Storage (PVC) Enabled for historical data.
-   **Declarative**: Dashboards and Alerts must be defined in code (YAML/JSON/ConfigMaps), not created manually in the UI.
-   **Access**: Grafana must be secured (e.g., admin password set or OAuth).

# Output Format
Provide the `values.yaml` file for the Helm chart.
-   Configuration overrides.
-   Example `ServiceMonitor` manifest.

# Golden Rules 🌟
1.  **Operator Pattern** - Use the `kube-prometheus-stack` (formerly Prometheus Operator) for easiest management of the full stack.
2.  **Persistence** - Always enable persistent storage (PVC) for Prometheus and Grafana to survive pod restarts.
3.  **ServiceMonitors** - Use `ServiceMonitor` CRDs to define how to scrape services, rather than static configs.
4.  **Dashboards as Code** - Store Grafana dashboards as ConfigMaps so they are version controlled and automatically loaded.
5.  **Alerting** - Define `PrometheusRule` CRDs for alerts (e.g., HighCPU, PodCrashing) and route them via Alertmanager.

## Technology-Specific Best Practices
-   **High Availability**: Enable `prometheus.prometheusSpec.replicas: 2` for HA.
-   **Retention**: Configure `retention` (e.g., 15d) based on storage capacity.
-   **Resource Limits**: Prometheus can be memory hungry; set requests/limits carefully based on metric volume (series).
-   **Remote Write**: For long-term storage (months/years), configure `remoteWrite` to sending metrics to Thanos, Cortex, or cloud equivalents.

## Complete Code Example

This Helm values file configures a robust monitoring stack.

```yaml
# values.yaml for kube-prometheus-stack
prometheus:
  prometheusSpec:
    retention: 10d
    replicas: 2
    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: standard
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 50Gi
    
    # Select ServiceMonitors with specific labels
    serviceMonitorSelector:
      matchLabels:
        release: my-project

alertmanager:
  config:
    global:
      resolve_timeout: 5m
    route:
      group_by: ['job']
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 12h
      receiver: 'slack-notifications'
      routes:
      - match:
          alertname: Watchdog
        receiver: 'null'
    receivers:
    - name: 'null'
    - name: 'slack-notifications'
      slack_configs:
      - channel: '#alerts'
        api_url: 'https://hooks.slack.com/services/T000/B000/XXXX'
        send_resolved: true

grafana:
  persistence:
    enabled: true
    size: 10Gi
  adminPassword: "admin"
  
  # Import default dashboards
  dashboardProviders:
    dashboardproviders.yaml:
      apiVersion: 1
      providers:
      - name: 'default'
        orgId: 1
        folder: ''
        type: file
        disableDeletion: false
        editable: true
        options:
          path: /var/lib/grafana/dashboards/default

  dashboards:
    default:
      node-exporter:
        url: https://raw.githubusercontent.com/rfmoz/grafana-dashboards/master/prometheus/node-exporter-full.json
        datasource: Prometheus

ingress:
  enabled: true
  hosts:
    - grafana.my-domain.com
```

## Security Considerations
-   **Authentication**: Grafana should be behind an OAuth proxy or use built-in auth (Google/GitHub).
-   **Network Policies**: Restrict traffic so only Prometheus can scrape metrics endpoints.
-   **ReadOnly**: Mount dashboards as ReadOnly to prevent UI edits ("Drift").
