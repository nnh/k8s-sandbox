import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";

const vpc = new awsx.Network(`${pulumi.getProject()}-vpc`, { numberOfAvailabilityZones: 3, usePrivateSubnets: false });
const cluster = new eks.Cluster(pulumi.getProject(), {
    vpcId: vpc.vpcId,
    subnetIds: vpc.subnetIds,
    desiredCapacity: 3,
    minSize: 1,
    maxSize: 3,
    storageClasses: "gp2",
    deployDashboard: false,
    instanceType: aws.ec2.T2InstanceSmall,
});

const labels = { app: "k8s-sandbox" };
const deployment = new k8s.apps.v1.Deployment("app", {
  spec: {
    selector: { matchLabels: labels },
    replicas: 2,
    template: {
      metadata: { labels },
      spec: {
        containers: [{
          name: "rails",
          image: "140031108709.dkr.ecr.ap-northeast-1.amazonaws.com/k8s-sandbox-rails:1.0",
          imagePullPolicy: "Always",
          resources: {
            requests: { memory: "256Mi", cpu: "200m" },
            limits: { memory: "256Mi", cpu: "200m" },
          },
          ports: [{ name: "puma", containerPort: 3000 }]
        }, {
          name: "nginx",
          image: "140031108709.dkr.ecr.ap-northeast-1.amazonaws.com/k8s-sandbox-nginx:1.0",
          imagePullPolicy: "Always",
          resources: {
            requests: { memory: "128Mi", cpu: "50m" },
            limits: { memory: "128Mi", cpu: "100m" },
          },
          ports: [{ name: "http-server", containerPort: 80 }]
        }],
        hostAliases: [{
          ip: "127.0.0.1",
          hostnames: ["rails"]
        }]
      }
    }
  }
}, {
  provider: cluster.provider
});

const service = new k8s.core.v1.Service("k8s-sandbox-service", {
  metadata: {
    labels: { app: "k8s-sandbox-service" }
  },
  spec: {
    type: "LoadBalancer",
    ports: [{
      port: 80,
      protocol: "TCP",
      targetPort: 80
    }],
    selector: labels
  }
}, {
  provider: cluster.provider
});

export const kubeconfig = cluster.kubeconfig
export const deploymanetName = deployment.metadata.apply(m => m.name);
export const serviceName = service.metadata.apply(m => m.name);