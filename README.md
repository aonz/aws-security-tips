# AWS Security Tips

## Prerequisite

- Install [Git](https://git-scm.com/downloads)
- Install [Node.js](https://nodejs.org/en/download/) and [Yarn](https://classic.yarnpkg.com/en/docs/install/)
- Install [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html)
- Install [Docker](https://docs.docker.com/get-docker/)

## 1. git-secrets

```
export GIT_INTERNAL_GETTEXT_TEST_FALLBACKS=1 # Optional.

git-secrets --scan -r ./1-git-secrets
```

## 2. AWS Systems ManagerSession Manager

- Deploy AWS resources with AWS CDK.

```
# Create key pair named 'security-tips'.

cd 2-ssm-session

yarn && yarn build

cdk deploy --require-approval never
```

- Edit `~/.ssh/config ` and [install the Session Manager plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html)

```
# SSH over Session Manager
Host i-* mi-*
  ProxyCommand sh -c "aws ssm start-session --target %h --document-name AWS-StartSSHSession --parameters 'portNumber=%p'"
```

- Test SSH, Port Forwarding and RDP.

```
LINUX_INSTANCE_ID=<instance id>

ssh -i security-tips.pem ec2-user@${LINUX_INSTANCE_ID}

aws ssm start-session \
  --target ${LINUX_INSTANCE_ID} \
  --document-name AWS-StartPortForwardingSession \
  --parameters '{"portNumber":["80"],"localPortNumber":["8080"]}'

# Open browser at http://localhost:8080

WINDOWS_INSTANCE_ID=<instance id>
aws ssm start-session \
  --target ${WINDOWS_INSTANCE_ID} \
  --document-name AWS-StartPortForwardingSession \
  --parameters '{"portNumber":["3389"],"localPortNumber":["13389"]}'

# RDP to localhost:13389, use .pem file to get the password
```
