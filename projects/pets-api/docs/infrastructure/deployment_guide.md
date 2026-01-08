# Deployment Guide: Pets API

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Docker installed
- Maven installed (for local builds)
- GitHub repository with Actions enabled

## Local Development Setup

### 1. Start Local Environment

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Pets API application on port 8080

### 2. Verify Services

```bash
# Check database health
docker exec pets-api-db pg_isready -U petsuser

# Check application health
curl http://localhost:8080/actuator/health
```

### 3. Stop Local Environment

```bash
docker-compose down
```

To remove volumes:

```bash
docker-compose down -v
```

## AWS Infrastructure Setup

### 1. Create VPC and Networking

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=pets-api-vpc}]'

# Create subnets (public and private in 2 AZs)
# Create Internet Gateway
# Create NAT Gateways
# Configure route tables
```

### 2. Create RDS Database

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name pets-api-db-subnet-group \
  --db-subnet-group-description "Subnet group for Pets API database" \
  --subnet-ids subnet-xxx subnet-yyy

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier pets-api-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username admin \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --multi-az \
  --vpc-security-group-ids sg-xxx \
  --db-subnet-group-name pets-api-db-subnet-group \
  --backup-retention-period 7 \
  --deletion-protection
```

### 3. Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name pets-api \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256
```

### 4. Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name pets-api-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy \
    capacityProvider=FARGATE,weight=1 \
    capacityProvider=FARGATE_SPOT,weight=1
```

### 5. Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name pets-api-alb \
  --subnets subnet-public-1 subnet-public-2 \
  --security-groups sg-alb-xxx \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4

# Create target group
aws elbv2 create-target-group \
  --name pets-api-tg \
  --protocol HTTP \
  --port 8080 \
  --vpc-id vpc-xxx \
  --target-type ip \
  --health-check-path /actuator/health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:REGION:ACCOUNT:loadbalancer/app/pets-api-alb/xxx \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:REGION:ACCOUNT:certificate/xxx \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:REGION:ACCOUNT:targetgroup/pets-api-tg/xxx
```

### 6. Create IAM Roles

#### ECS Task Execution Role

```bash
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://trust-policy.json

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite
```

#### ECS Task Role

```bash
aws iam create-role \
  --role-name ecsTaskRole \
  --assume-role-policy-document file://trust-policy.json

aws iam attach-role-policy \
  --role-name ecsTaskRole \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite
```

### 7. Create Secrets in Secrets Manager

```bash
# Database URL
aws secretsmanager create-secret \
  --name pets-api/db-url \
  --secret-string "jdbc:postgresql://pets-api-db.xxx.region.rds.amazonaws.com:5432/petsdb"

# Database username
aws secretsmanager create-secret \
  --name pets-api/db-username \
  --secret-string "admin"

# Database password
aws secretsmanager create-secret \
  --name pets-api/db-password \
  --secret-string "YOUR_SECURE_PASSWORD"

# JWT secret
aws secretsmanager create-secret \
  --name pets-api/jwt-secret \
  --secret-string "YOUR_JWT_SECRET_KEY"
```

### 8. Create CloudWatch Log Group

```bash
aws logs create-log-group \
  --log-group-name /ecs/pets-api \
  --retention-in-days 30
```

### 9. Register Task Definition

Update `.aws/task-definition.json` with your actual values, then:

```bash
aws ecs register-task-definition \
  --cli-input-json file://.aws/task-definition.json
```

### 10. Create ECS Service

```bash
aws ecs create-service \
  --cluster pets-api-cluster \
  --service-name pets-api-service \
  --task-definition pets-api \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:REGION:ACCOUNT:targetgroup/pets-api-tg/xxx,containerName=pets-api,containerPort=8080" \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100,deploymentCircuitBreaker={enable=true,rollback=true}" \
  --health-check-grace-period-seconds 60
```

### 11. Configure Auto Scaling

```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/pets-api-cluster/pets-api-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/pets-api-cluster/pets-api-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }'
```

## CI/CD Setup

### 1. Configure GitHub Secrets

In your GitHub repository, add the following secrets:

- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

### 2. Update Workflow Configuration

Update `.github/workflows/build-and-deploy.yml` with your actual:
- AWS region
- ECR repository name
- ECS cluster name
- ECS service name

### 3. Push to Main Branch

The workflow will automatically:
1. Build and test the application
2. Build Docker image
3. Push to ECR
4. Deploy to ECS

## Monitoring Setup

### 1. Create CloudWatch Alarms

```bash
# High CPU
aws cloudwatch put-metric-alarm \
  --alarm-name pets-api-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold

# High Memory
aws cloudwatch put-metric-alarm \
  --alarm-name pets-api-high-memory \
  --alarm-description "Alert when memory exceeds 85%" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold
```

### 2. Create SNS Topic for Alerts

```bash
aws sns create-topic --name pets-api-alerts

# Subscribe email
aws sns subscribe \
  --topic-arn arn:aws:sns:REGION:ACCOUNT:pets-api-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Verification

### 1. Check ECS Service Status

```bash
aws ecs describe-services \
  --cluster pets-api-cluster \
  --services pets-api-service
```

### 2. Check Application Health

```bash
curl https://your-alb-dns-name.region.elb.amazonaws.com/actuator/health
```

### 3. View Logs

```bash
aws logs tail /ecs/pets-api --follow
```

## Troubleshooting

### Service Not Starting

1. Check task definition logs:
```bash
aws ecs describe-tasks \
  --cluster pets-api-cluster \
  --tasks TASK_ID
```

2. Check CloudWatch logs:
```bash
aws logs tail /ecs/pets-api --follow
```

### Health Check Failures

1. Verify security group rules allow traffic
2. Check application logs for errors
3. Verify database connectivity
4. Check secrets are correctly configured

### Deployment Failures

1. Check GitHub Actions logs
2. Verify AWS credentials
3. Check ECR repository permissions
4. Verify task definition is valid

## Maintenance

### Update Application

1. Push code to main branch
2. GitHub Actions will automatically deploy
3. Monitor deployment in ECS console

### Update Task Definition

1. Update `.aws/task-definition.json`
2. Register new revision:
```bash
aws ecs register-task-definition \
  --cli-input-json file://.aws/task-definition.json
```
3. Update service:
```bash
aws ecs update-service \
  --cluster pets-api-cluster \
  --service pets-api-service \
  --task-definition pets-api:NEW_REVISION
```

### Database Backups

Backups are automated with 7-day retention. To create manual snapshot:

```bash
aws rds create-db-snapshot \
  --db-instance-identifier pets-api-db \
  --db-snapshot-identifier pets-api-manual-snapshot-$(date +%Y%m%d)
```
