#!/bin/bash
cp ~/.kube/config .
# Secret for kube-system namespace
kubectl create secret generic kubeconfig --from-file . --namespace=kube-system
# Secret for default namespace
kubectl create secret generic kubeconfig --from-file .

echo "Secrets Created"

