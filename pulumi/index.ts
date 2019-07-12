import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as eks from "@pulumi/eks";

// const config = new pulumi.Config("k8s-sandbox");
// const stackName = pulumi.getStack();

const vpc = new awsx.Network(`${pulumi.getProject()}-vpc`, { usePrivateSubnets: false });
const cluster = new eks.Cluster(pulumi.getProject(), {
    vpcId: vpc.vpcId,
    subnetIds: vpc.subnetIds,
    desiredCapacity: 2,
    minSize: 1,
    maxSize: 2,
    storageClasses: "gp2",
    deployDashboard: false,
    instanceType: aws.ec2.T2InstanceSmall,
});

export const kubeconfig = cluster.kubeconfig