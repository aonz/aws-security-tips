#!/bin/bash

aws secretsmanager delete-secret --secret-id SensitiveData --force-delete-without-recovery

aws ssm delete-parameter --name SensitiveData

eksctl delete cluster -f cluster.yaml