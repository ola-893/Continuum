# Monitoring and Alerting Setup Guide

**Project:** Continuum Protocol - Tezos Mainnet  
**Date:** February 8, 2026  
**Purpose:** Configure comprehensive monitoring and alerting for production  
**Requirement:** 20.9

## Executive Summary

This document provides a comprehensive guide for setting up monitoring and alerting systems for the Continuum Protocol on Tezos Mainnet. The monitoring system tracks contract health, user activity, system performance, and security metrics.

**Monitoring Stack:**
- **Metrics Collection:** Prometheus
- **Visualization:** Grafana
- **Alerting:** AlertManager + PagerDuty
- **Logging:** ELK Stack (Elasticsearch, Logstash, Kibana)
- **Uptime Monitoring:** UptimeRobot
- **Error Tracking:** Sentry

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Metrics to Monitor](#metrics-to-monitor)
3. [Alert Configuration](#alert-configuration)
4. [Dashboard Setup](#dashboard-setup)
5. [Incident Response](#incident-response)
6. [Maintenance and Updates](#maintenance-and-updates)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Tezos Mainnet                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Streaming   │  │  Compliance  │  │  RWA Hub     │     │
│  │  Protocol    │  │  Guard       │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Event Indexer                              │
│  - Listens to contract events                               │
│  - Parses and stores in database                            │
│  - Exposes metrics endpoint                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Prometheus                                 │
│  - Scrapes metrics every 15s                                │
│  - Stores time-series data                                  │
│  - Evaluates alert rules                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────┐    ┌──────────────────────┐
│     Grafana          │    │   AlertManager       │
│  - Visualizations    │    │  - Alert routing     │
│  - Dashboards        │    │  - Deduplication     │
│  - Queries           │    │  - Notifications     │
└──────────────────────┘    └──────────────────────┘
                                        │
                            ┌───────────┴───────────┐
                            ▼                       ▼
                ┌──────────────────┐    ┌──────────────────┐
                │   PagerDuty      │    │   Slack          │
                │  - On-call       │    │  - Team alerts   │
                │  - Escalation    │    │  - Notifications │
                └──────────────────┘    └──────────────────┘
```

---

## Metrics to Monitor

### 1. Contract Health Metrics

**Streaming Protocol:**
```yaml
# Total streams created
continuum_streams_total{contract="streaming_protocol"}

# Active streams
continuum_streams_active{contract="streaming_protocol"}

# Total value locked (in mutez)
continuum_tvl_mutez{contract="streaming_protocol"}

# Withdrawals per hour
continuum_withdrawals_per_hour{contract="streaming_protocol"}

# Flash advances per hour
continuum_flash_advances_per_hour{contract="streaming_protocol"}

# Stream cancellations per hour
continuum_cancellations_per_hour{contract="streaming_protocol"}

# Average stream duration (seconds)
continuum_stream_duration_avg{contract="streaming_protocol"}

# Contract paused status
continuum_contract_paused{contract="streaming_protocol"}
```

**Compliance Guard:**
```yaml
# Total registered users
continuum_users_registered_total{contract="compliance_guard"}

# Users with valid KYC
continuum_users_kyc_valid{contract="compliance_guard"}

# Frozen streams
continuum_streams_frozen_total{contract="compliance_guard"}

# Compliance checks per hour
continuum_compliance_checks_per_hour{contract="compliance_guard"}

# Failed compliance checks per hour
continuum_compliance_failures_per_hour{contract="compliance_guard"}
```

**Token Registry:**
```yaml
# Total registered tokens
continuum_tokens_registered_total{contract="token_registry"}

# Tokens by asset type
continuum_tokens_by_type{asset_type="0|1|2",contract="token_registry"}

# Token registrations per hour
continuum_token_registrations_per_hour{contract="token_registry"}
```

**RWA Hub:**
```yaml
# Compliant stream creations per hour
continuum_compliant_streams_per_hour{contract="rwa_hub"}

# Yield claims per hour
continuum_yield_claims_per_hour{contract="rwa_hub"}

# Emergency freezes per hour
continuum_emergency_freezes_per_hour{contract="rwa_hub"}

# Active rentals
continuum_active_rentals{contract="rwa_hub"}
```

### 2. Performance Metrics

```yaml
# Transaction response time (milliseconds)
continuum_tx_response_time_ms{operation="create_stream|withdraw|etc"}

# Transaction success rate
continuum_tx_success_rate{operation="create_stream|withdraw|etc"}

# Transaction failure rate
continuum_tx_failure_rate{operation="create_stream|withdraw|etc"}

# Gas consumption per operation
continuum_gas_consumption{operation="create_stream|withdraw|etc"}

# View function response time (milliseconds)
continuum_view_response_time_ms{function="get_claimable_balance|etc"}
```

### 3. Business Metrics

```yaml
# Daily active users
continuum_dau

# Monthly active users
continuum_mau

# Total value locked (USD)
continuum_tvl_usd

# Total yield distributed (USD)
continuum_yield_distributed_usd

# Revenue (if applicable)
continuum_revenue_usd

# User retention rate
continuum_retention_rate
```

### 4. Security Metrics

```yaml
# Failed authorization attempts
continuum_auth_failures_per_hour

# Suspicious activity detected
continuum_suspicious_activity_per_hour

# Contract pause events
continuum_pause_events_total

# Admin operations per hour
continuum_admin_operations_per_hour

# Unusual transaction patterns
continuum_unusual_patterns_detected
```

### 5. System Metrics

```yaml
# Indexer lag (seconds behind blockchain)
continuum_indexer_lag_seconds

# Database connection pool usage
continuum_db_connections_active

# API request rate
continuum_api_requests_per_second

# API error rate
continuum_api_error_rate

# Frontend page load time
continuum_frontend_load_time_ms
```

---

## Alert Configuration

### Critical Alerts (Page On-Call Engineer)

**1. Contract Paused**
```yaml
alert: ContractPaused
expr: continuum_contract_paused == 1
for: 1m
severity: critical
annotations:
  summary: "Contract {{ $labels.contract }} is paused"
  description: "Emergency pause has been activated"
  action: "Investigate immediately and determine if intentional"
```

**2. High Transaction Failure Rate**
```yaml
alert: HighTransactionFailureRate
expr: rate(continuum_tx_failure_rate[5m]) > 0.1
for: 5m
severity: critical
annotations:
  summary: "Transaction failure rate above 10%"
  description: "{{ $value }}% of transactions are failing"
  action: "Check contract health and network status"
```

**3. TVL Drop**
```yaml
alert: TVLDropSignificant
expr: (continuum_tvl_usd - continuum_tvl_usd offset 1h) / continuum_tvl_usd offset 1h < -0.2
for: 5m
severity: critical
annotations:
  summary: "TVL dropped by more than 20% in 1 hour"
  description: "Current TVL: ${{ $value }}"
  action: "Investigate for potential exploit or mass withdrawal"
```

**4. Indexer Lag**
```yaml
alert: IndexerLagHigh
expr: continuum_indexer_lag_seconds > 300
for: 5m
severity: critical
annotations:
  summary: "Indexer is more than 5 minutes behind"
  description: "Current lag: {{ $value }} seconds"
  action: "Check indexer service and database performance"
```

**5. Suspicious Activity**
```yaml
alert: SuspiciousActivityDetected
expr: continuum_suspicious_activity_per_hour > 10
for: 1m
severity: critical
annotations:
  summary: "Unusual activity pattern detected"
  description: "{{ $value }} suspicious events in the last hour"
  action: "Review security logs and consider emergency pause"
```

### High Priority Alerts (Notify Team)

**6. High Gas Costs**
```yaml
alert: GasCostsHigh
expr: continuum_gas_consumption > 200000
for: 15m
severity: high
annotations:
  summary: "Gas costs are unusually high"
  description: "Average gas: {{ $value }}"
  action: "Review recent contract changes and optimize if needed"
```

**7. Compliance Check Failures**
```yaml
alert: ComplianceCheckFailuresHigh
expr: rate(continuum_compliance_failures_per_hour[15m]) > 50
for: 15m
severity: high
annotations:
  summary: "High rate of compliance check failures"
  description: "{{ $value }} failures per hour"
  action: "Review compliance guard configuration"
```

**8. Low User Activity**
```yaml
alert: UserActivityLow
expr: continuum_dau < 10
for: 1h
severity: high
annotations:
  summary: "Daily active users below threshold"
  description: "Current DAU: {{ $value }}"
  action: "Check for frontend issues or user communication problems"
```

### Medium Priority Alerts (Log and Monitor)

**9. Slow Response Times**
```yaml
alert: SlowResponseTimes
expr: continuum_tx_response_time_ms > 5000
for: 30m
severity: medium
annotations:
  summary: "Transaction response times are slow"
  description: "Average response time: {{ $value }}ms"
  action: "Monitor and optimize if persists"
```

**10. Database Connection Pool High**
```yaml
alert: DatabaseConnectionsHigh
expr: continuum_db_connections_active / continuum_db_connections_max > 0.8
for: 15m
severity: medium
annotations:
  summary: "Database connection pool usage above 80%"
  description: "Current usage: {{ $value }}%"
  action: "Consider scaling database or optimizing queries"
```

---

## Dashboard Setup

### Main Dashboard

**Overview Panel:**
- Total Value Locked (TVL)
- Active Streams
- Daily Active Users (DAU)
- Transaction Success Rate

**Activity Panel:**
- Transactions per hour (line chart)
- Operations breakdown (pie chart)
- User activity (heatmap)

**Performance Panel:**
- Response times (line chart)
- Gas costs (line chart)
- Error rates (line chart)

**Health Panel:**
- Contract status (status indicators)
- Indexer lag (gauge)
- Alert status (list)

### Contract-Specific Dashboards

**Streaming Protocol Dashboard:**
- Total streams created
- Active streams
- TVL in streams
- Withdrawals per hour
- Flash advances per hour
- Average stream duration

**Compliance Guard Dashboard:**
- Total registered users
- Users with valid KYC
- Frozen streams
- Compliance checks per hour
- Failed checks per hour

**Token Registry Dashboard:**
- Total registered tokens
- Tokens by asset type
- Registration rate
- Query performance

**RWA Hub Dashboard:**
- Compliant stream creations
- Yield claims
- Emergency freezes
- Active rentals

### User Experience Dashboard

**Frontend Metrics:**
- Page load times
- API response times
- Error rates
- User sessions

**User Journey:**
- Wallet connections
- Stream creations
- Yield claims
- Asset transfers

---

## Incident Response

### Incident Severity Levels

**P0 - Critical (Response: <15 minutes)**
- Contract security breach
- System-wide outage
- Data loss
- TVL drop >20%

**P1 - High (Response: <1 hour)**
- High transaction failure rate
- Indexer failure
- Compliance system down
- Major feature broken

**P2 - Medium (Response: <4 hours)**
- Performance degradation
- Minor feature broken
- High gas costs
- Database issues

**P3 - Low (Response: <24 hours)**
- Cosmetic issues
- Documentation errors
- Minor bugs
- Feature requests

### Incident Response Workflow

**1. Detection (Automated)**
- Alert triggered
- Notification sent
- Incident created

**2. Acknowledgment (<5 minutes)**
- On-call engineer acknowledges
- Initial assessment
- Severity classification

**3. Investigation (<15 minutes for P0)**
- Review logs
- Check metrics
- Identify root cause

**4. Mitigation (<30 minutes for P0)**
- Implement fix or workaround
- Test solution
- Deploy if needed

**5. Resolution**
- Verify fix works
- Monitor for recurrence
- Close incident

**6. Post-Mortem (Within 48 hours)**
- Document incident
- Identify root cause
- Implement preventive measures
- Update runbooks

### Escalation Path

**Level 1: On-Call Engineer**
- Initial response
- Basic troubleshooting
- Escalate if needed

**Level 2: Technical Lead**
- Complex issues
- Architecture decisions
- Escalate if needed

**Level 3: CTO/Founder**
- Critical decisions
- Business impact
- External communication

### Communication During Incidents

**Internal:**
- Slack #incidents channel
- Status updates every 30 minutes
- Post-mortem document

**External:**
- Status page update
- Twitter announcement (if user-facing)
- Email to affected users
- Post-mortem blog post (if major)

---

## Maintenance and Updates

### Regular Maintenance Tasks

**Daily:**
- Review alert status
- Check dashboard metrics
- Verify monitoring systems operational

**Weekly:**
- Review incident reports
- Update alert thresholds if needed
- Check for monitoring system updates

**Monthly:**
- Review and optimize dashboards
- Analyze trends
- Update documentation
- Test incident response procedures

**Quarterly:**
- Comprehensive system review
- Update monitoring strategy
- Team training on new tools
- Disaster recovery drill

### Monitoring System Updates

**Update Process:**
1. Test updates in staging
2. Schedule maintenance window
3. Backup current configuration
4. Apply updates
5. Verify functionality
6. Monitor for issues

**Rollback Plan:**
- Keep previous version available
- Document rollback steps
- Test rollback procedure
- Execute if issues detected

---

## Implementation Checklist

### Phase 1: Setup (Week 1)

- [ ] Deploy Prometheus server
- [ ] Deploy Grafana server
- [ ] Deploy AlertManager
- [ ] Configure PagerDuty integration
- [ ] Configure Slack integration
- [ ] Set up ELK stack
- [ ] Deploy event indexer

### Phase 2: Configuration (Week 2)

- [ ] Configure Prometheus scrape targets
- [ ] Create Grafana dashboards
- [ ] Configure alert rules
- [ ] Set up alert routing
- [ ] Configure on-call schedule
- [ ] Test alerting system

### Phase 3: Testing (Week 3)

- [ ] Test all metrics collection
- [ ] Test all alerts
- [ ] Test incident response workflow
- [ ] Test escalation procedures
- [ ] Conduct fire drill
- [ ] Document any issues

### Phase 4: Production (Week 4)

- [ ] Enable monitoring in production
- [ ] Monitor for 24 hours
- [ ] Adjust thresholds as needed
- [ ] Train team on systems
- [ ] Document procedures
- [ ] Go live

---

## Monitoring Tools Configuration

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'continuum-indexer'
    static_configs:
      - targets: ['indexer:9090']
    
  - job_name: 'continuum-api'
    static_configs:
      - targets: ['api:9091']
    
  - job_name: 'continuum-frontend'
    static_configs:
      - targets: ['frontend:9092']

rule_files:
  - 'alerts.yml'

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

### AlertManager Configuration

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m
  pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'
  slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      continue: true
    
    - match:
        severity: high
      receiver: 'slack-high'
    
    - match:
        severity: medium
      receiver: 'slack-medium'

receivers:
  - name: 'default'
    slack_configs:
      - channel: '#alerts'
        title: 'Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
  
  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'
        description: '{{ .GroupLabels.alertname }}'
  
  - name: 'slack-high'
    slack_configs:
      - channel: '#alerts-high'
        title: 'High Priority Alert'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
  
  - name: 'slack-medium'
    slack_configs:
      - channel: '#alerts-medium'
        title: 'Medium Priority Alert'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

### Grafana Dashboard JSON

```json
{
  "dashboard": {
    "title": "Continuum Protocol - Main Dashboard",
    "panels": [
      {
        "title": "Total Value Locked",
        "type": "stat",
        "targets": [
          {
            "expr": "continuum_tvl_usd"
          }
        ]
      },
      {
        "title": "Active Streams",
        "type": "stat",
        "targets": [
          {
            "expr": "continuum_streams_active"
          }
        ]
      },
      {
        "title": "Transactions per Hour",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(continuum_tx_total[1h])"
          }
        ]
      }
    ]
  }
}
```

---

## Conclusion

This monitoring and alerting setup provides comprehensive visibility into the Continuum Protocol's health, performance, and security. Regular maintenance and updates ensure the system remains effective as the protocol evolves.

**Key Takeaways:**
- Monitor contract health, performance, and security
- Alert on critical issues immediately
- Provide clear dashboards for visibility
- Have incident response procedures ready
- Maintain and update monitoring systems regularly

**Next Steps:**
1. Implement monitoring infrastructure
2. Configure all metrics and alerts
3. Create dashboards
4. Test incident response
5. Train team
6. Go live with monitoring

---

**Document Version:** 1.0  
**Last Updated:** February 8, 2026  
**Next Review:** Before Mainnet launch
