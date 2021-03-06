## Setting up the kubernetes cluster

### The discussion below is based on the following articles:

https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/

https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/

### Kubernetes Cluster OpenStack DnetCloud

Some notes before we begin

* Swap is disabled by default on all nodes, no need to worry
* you can use a c2m4 for 2 workers and the control plane and one heavy duty c4m8 cluster.
* by default all bridged traffic is seen by the nodes so no need to fix sysctl 

Run the following commands (on each node)

### (1) install kubeadm and kubectl

```bash
sudo apt-get update && sudo apt-get install -y apt-transport-https curl
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
cat <<EOF | sudo tee /etc/apt/sources.list.d/kubernetes.list
deb https://apt.kubernetes.io/ kubernetes-xenial main
EOF
sudo apt update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
```

Repeat the above sequence for every machine that you want to add to the cluster.

### (2) initialize the control plane on the manager

```bash
sudo kubeadm init --pod-network-cidr=192.168.0.0/16
```

This command will initialize the kubernetes control pane, and prepare the network for the `calico` CNI. (Container network plugin)

**NOTE**: we're running on the latest version of kubernetes, the question is if we can still replicate the results. Take into account the version skew when initializing the kubernetes cluster!

### (3) initialize kubectl with the following commands:

```bash
  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

To allow other nodes to join later it is important to store the token etc somewhere safely, the result should look something like this:

```bash
sudo kubeadm join <master-node>:<port> --token <token> \
    --discovery-token-ca-cert-hash sha256:<hash> 
```

### (4) Add Container Network Plugin:

```bash
kubectl apply -f https://docs.projectcalico.org/v3.11/manifests/calico.yaml
```

Calico may crash on some weird security check, just ignore it:

```
kubectl -n kube-system set env daemonset/calico-node FELIX_IGNORELOOSERPF=true
```

### (5) Adding nodes to the network

Repeat (1) for every node that you wish to add. Then use the join token generated by kubeadm init to add the new nodes. You can re-fetch the node by executing `kubeadm token list`. Or generate a new one see `kubeadm token` for reference.

Then execute the following command to join the cluster:

```bash
sudo kubeadm join <master-node>:<port> --token <token> \
    --discovery-token-ca-cert-hash sha256:<hash> 
```



### (6) Installing helm

Using helm 2.8 doesn't work with the latest version of the cluster. Just dowload the latest release tar from github (https://github.com/helm/helm) and follow the  instructions on the k8-scalar page to install helm in the `$PATH` of the user.  

For helm 3.1.2 (assuming the tar is in your current directory):

```bash
tar xvzf helm-v3.1.2-linux-amd64.tar.gz && chmod +x ./linux-amd64/helm && sudo mv ./linux-amd64/helm /usr/local/bin/helm
```

Note that `helm init` was removed from `helm 3.0.0` and that this process is done automatically. Such that there is no need to create a new service account.

To install the monitoring infrastructure:

```bash
helm install monitoring-base ${k8-scalar-dir}/operations-openstack/monitoring-core-rbac
```

Note that the helm charts were broken for kubernetes 1.18. We had to update them, adding selectors for each service. For more information see the charts in the `${k8-scalar-dir}/operations-openstack/monitoring-core-rbac`

### (7) Installing the metrics server:

```
kubectl apply -f ${k8-scalar-dir}/operations-openstack/metrics-server
```

Note that this is a modified version of the 3.6.0 release (the pre-release of version 3.7.0 is not working for some reason). To be able to pull metrics (presumably because we have no certificates), you need to pass the following flags to the container command:

```yaml
command:
  - /metrics-server
  - --kubelet-insecure-tls
  - --kubelet-preferred-address-types=InternalIP
  - --metric-resolution=10s
```

and add a new node selector such that it will be scheduled on the monitoring node

```yaml
nodeSelector:
	- monitoringNode:"yes"
```

By now grafana should be returning graphs for monitoring your nodes and pods etc.

###  (8) Installing the Cassandra cluster

We want to prevent kubernetes from installing Cassandra nodes on the same worker node and prevent them from installing on the same node as the experiment controller. For this reason we use the following pod affinity and node selectors:

```yaml
affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
            - key: app
              operator: In
              values:
                - cassandra
                - experiment-controller
          topologyKey: "kubernetes.io/hostname"
nodeSelector:
  monitoringNode: "no"
```

Install the Cassandra chart using `helm install`

```bash
helm install cassanda ${k8-scalar-dir}/operations-openstack/cassandra-cluster
```

To prevent the experiment controller from being scheduled on the same node as the cassandra instances, we just place it on the `monitoring node` (our heavy duty node). If we would use more instances of the experiment controller we could add a pod anti affinity for other experiment controllers.

### (9) installing the experiment controller

Before we can add the experiment controller, we need to generate some secrets for the controller (such that it can communicate with the other parts of the deployment.) to do this run:

```bash
bash ${k8-scalar-dir}/operations-openstack/secrets/install-secrets.sh
```

or do it manually by entering the following commands:

```bash
cp ~/.kube/config .
# Secret for kube-system namespace
kubectl create secret generic kubeconfig --from-file . --namespace=kube-system
# Secret for default namespace
kubectl create secret generic kubeconfig --from-file .
```

After generating the secrets, do install the helm chart for the experiment controller:

```bash
helm install experiment-controller ${k8-scalar-dir}/operations-openstack/experiment-controller
```

It may take a while before the pod is ready since the image for the scalar must be pulled (approx 1Gb in size).

## Execute the experiments

To execute the experiments in the cluster we need to talk to the experiment controller, note that executing the experiments requires deleting and re-installing the cassandra instances and experiment controller (to clear the data etc).

baseline command (targeting the single experiment controller node):

```bash
kubectl exec experiment-controller-0 -- bash bin/stress.sh --duration <step-duration> <#messages-start>:<#messages-end>:<step-size>
```

deleting the cassanda cluster & experiment controller can be achieved by using the earlier defined names.

```
helm delete <name>
```

for the Cassandra cluster:

```
helm delete cassandra
```

for the experiment controller

```
helm delete experiment-controller
```

### Two instances (added by hand, no HPA)

First scale the Cassandra statefulset

```bash
kubectl scale statefulset cassandra-cluster --replicas=2
```

To flex even a bit of muscle we need to start at 1000 messages per second. Otherwise the cluster won't even get close to it's request

```bash
 kubectl exec experiment-controller-0 -- bash bin/stress.sh --duration 600 1000:3500:500
```

to fetch the results from the experiment controller, ssh into the worker instance where the experiment controller is deployed and use 

```bash
sudo docker cp <container-name>:/exp/var/results .
```

 to copy the experiment results. Then copy the results from the remote location to your local machine using scp:

```bash
scp -r -i <ssh-key-pem> ubuntu@<worker-ip>:/home/ubuntu/results/ <local-target-dir>
```

### One instance (no HPA)

Repeat the above experiment but without scaling the cassandra statefulset

### Two instances (With HPA)