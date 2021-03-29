#!/bin/bash

aws secretsmanager create-secret --name SensitiveData --secret-string 'Secrets Manager'
aws ssm put-parameter --name SensitiveData --type 'SecureString' --value 'Parameter Store'

eksctl create cluster -f cluster.yaml

brew install kubeseal
wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.15.0/controller.yaml
kubectl apply -f controller.yaml
rm -rf controller.yaml
kubeseal --fetch-cert > sealed-secret.pem
kubeseal --format=yaml < sealed-secret-secret.yaml > k8s/sealed-secret-secret.yaml
kubectl apply -f k8s/sealed-secret-secret.yaml

eksctl utils associate-iam-oidc-provider -f cluster.yaml --approve
eksctl create iamserviceaccount -f cluster.yaml --override-existing-serviceaccounts --approve
helm repo add external-secrets https://external-secrets.github.io/kubernetes-external-secrets/
helm install -n kube-system external-secrets external-secrets/kubernetes-external-secrets \
  --set env.AWS_REGIO=ap-southeast-1 --set securityContext.fsGroup=65534 \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"='arn:aws:iam::<account>:role/<role>'
kubectl apply -f k8s/external-secrets-secret.yaml