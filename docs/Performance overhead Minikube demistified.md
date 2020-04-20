### Performance overhead Minikube demistified:

Minikube runs all the pods  locally as seperate containers. This can be seen when executing `docker ps` when ssh'ing into the minikube vm:

executing:

```
docker ps --all --format "{{.Names}}"
```

Shows all the docker containers that are currently active:

```
k8s_grafana_monitoring-grafana-8fcc5f8d6-krm8q_kube-system_35ec3c1c-71d3-11ea-89d6-080027e049cd_1
k8s_tiller_tiller-deploy-7594bf7b76-bzr9q_kube-system_1253e67f-71d3-11ea-89d6-080027e049cd_1
k8s_influxdb_monitoring-influxdb-7bf9b74f99-xlnjt_kube-system_35ed9dc9-71d3-11ea-89d6-080027e049cd_1
k8s_POD_monitoring-influxdb-7bf9b74f99-xlnjt_kube-system_35ed9dc9-71d3-11ea-89d6-080027e049cd_1
k8s_POD_monitoring-grafana-8fcc5f8d6-krm8q_kube-system_35ec3c1c-71d3-11ea-89d6-080027e049cd_1
k8s_POD_tiller-deploy-7594bf7b76-bzr9q_kube-system_1253e67f-71d3-11ea-89d6-080027e049cd_1
k8s_storage-provisioner_storage-provisioner_kube-system_cc180747-71d1-11ea-89d6-080027e049cd_1
k8s_kubernetes-dashboard_kubernetes-dashboard-77d8b98585-mgchm_kube-system_cc677f45-71d1-11ea-89d6-080027e049cd_1
k8s_POD_storage-provisioner_kube-system_cc180747-71d1-11ea-89d6-080027e049cd_1
k8s_POD_kubernetes-dashboard-77d8b98585-mgchm_kube-system_cc677f45-71d1-11ea-89d6-080027e049cd_1
k8s_cassandra_cassandra-0_default_2f702648-71d3-11ea-89d6-080027e049cd_1
k8s_heapster_heapster-7b6f9c79d-62lcn_kube-system_35ed65ed-71d3-11ea-89d6-080027e049cd_1
k8s_experiment-controller_experiment-controller-0_default_6e6d17b7-71d3-11ea-89d6-080027e049cd_1
k8s_POD_heapster-7b6f9c79d-62lcn_kube-system_35ed65ed-71d3-11ea-89d6-080027e049cd_1
k8s_POD_cassandra-0_default_2f702648-71d3-11ea-89d6-080027e049cd_1
k8s_metrics-server_metrics-server-8468c85f7d-hv5ph_kube-system_400f2717-71d3-11ea-89d6-080027e049cd_1
k8s_POD_experiment-controller-0_default_6e6d17b7-71d3-11ea-89d6-080027e049cd_1
k8s_sidecar_kube-dns-54cccfbdf8-jrknc_kube-system_cc83c22a-71d1-11ea-89d6-080027e049cd_1
k8s_dnsmasq_kube-dns-54cccfbdf8-jrknc_kube-system_cc83c22a-71d1-11ea-89d6-080027e049cd_1
k8s_POD_metrics-server-8468c85f7d-hv5ph_kube-system_400f2717-71d3-11ea-89d6-080027e049cd_1
k8s_kubedns_kube-dns-54cccfbdf8-jrknc_kube-system_cc83c22a-71d1-11ea-89d6-080027e049cd_1
k8s_POD_kube-dns-54cccfbdf8-jrknc_kube-system_cc83c22a-71d1-11ea-89d6-080027e049cd_1
k8s_kube-addon-manager_kube-addon-manager-minikube_kube-system_c4c3188325a93a2d7fb1714e1abf1259_1
k8s_POD_kube-addon-manager-minikube_kube-system_c4c3188325a93a2d7fb1714e1abf1259_1
```

As you can see the following containers are active:

```
k8s_POD_cassandra-0_default_2f702648-71d3-11ea-89d6-080027e049cd_1
k8s_POD_experiment-controller-0_default_6e6d17b7-71d3-11ea-89d6-080027e049cd_1
```

These containers represent the kuberenetes pods. They are directly connected to the default docker network bridge. This means that they communicate directly via the virtual bridge. You can observe this by doing the following:

```bash
docker network ls
```

Will list the available networks in the minikube docker environment:

```
57ecfa27035f        bridge              bridge              local
d04b2441bf56        host                host                local
de2a2e1d4030        none                null                local
```

It is possible to inspect each network by executing the following command:

```
docker network inspect bridge
```

This will return all the containers that are connected to the bridge plus some additional information (shortened to only the relevant information regarding the pods. There is also information for the system pods listed in this command.)

```json
[
    {
        "Name": "bridge",
        "Id": "57ecfa27035fd92a04335c1a2246dd86416faefb129ec10590514711ebedd143",
        "Created": "2020-04-18T13:01:44.262440132Z",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "172.17.0.0/16",
                    "Gateway": "172.17.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "5b6fc4e05d4cfabf6ff8b948f9afff5e86b055ea9555e3e94cea23f3961f5902": {
                "Name": "k8s_POD_experiment-controller-0_default_6e6d17b7-71d3-11ea-89d6-080027e049cd_1",
                "EndpointID": "f83d102b7dba3e75cd61a7c8faea81324e310225073ecf814a7cef563d0fb22b",
                "MacAddress": "02:42:ac:11:00:04",
                "IPv4Address": "172.17.0.4/16",
                "IPv6Address": ""
            },
            "c5690cbdc4483cb020c9a572889e6caf0197574b30a99a77126d40d75e470538": {
                "Name": "k8s_POD_cassandra-0_default_2f702648-71d3-11ea-89d6-080027e049cd_1",
                "EndpointID": "aa2ccbe4c13026509f611a5a4cc95e4602d99a7f98ba61fb450c1a8dc8c09702",
                "MacAddress": "02:42:ac:11:00:05",
                "IPv4Address": "172.17.0.5/16",
                "IPv6Address": ""
            },
        },
        "Options": {
            "com.docker.network.bridge.default_bridge": "true",
            "com.docker.network.bridge.enable_icc": "true",
            "com.docker.network.bridge.enable_ip_masquerade": "true",
            "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
            "com.docker.network.bridge.name": "docker0",
            "com.docker.network.driver.mtu": "1500"
        },
        "Labels": {}
    }
]

```

Another interesting command is the `docker container inspect` command. When you inspect the pod containers, there is a `NetworkSettings` field that is filled in for containers configured in `host` and `bridge` mode. For containers networked with `none` and `contianer` modus there will be no entry. For example the `cassandra_POD` container lists the following network settings:

```json
 "NetworkSettings": {
            "Bridge": "",
            "SandboxID": "2a5238c96698bee2b144db275a7877ee99714bec4afc3e3c774e205da9d35dff",
            "HairpinMode": false,
            "LinkLocalIPv6Address": "",
            "LinkLocalIPv6PrefixLen": 0,
            "Ports": {},
            "SandboxKey": "/var/run/docker/netns/2a5238c96698",
            "SecondaryIPAddresses": null,
            "SecondaryIPv6Addresses": null,
            "EndpointID": "aa2ccbe4c13026509f611a5a4cc95e4602d99a7f98ba61fb450c1a8dc8c09702",
            "Gateway": "172.17.0.1",
            "GlobalIPv6Address": "",
            "GlobalIPv6PrefixLen": 0,
            "IPAddress": "172.17.0.5",
            "IPPrefixLen": 16,
            "IPv6Gateway": "",
            "MacAddress": "02:42:ac:11:00:05",
            "Networks": {
                "bridge": {
                    "IPAMConfig": null,
                    "Links": null,
                    "Aliases": null,
                    "NetworkID": "57ecfa27035fd92a04335c1a2246dd86416faefb129ec10590514711ebedd143",
                    "EndpointID": "aa2ccbe4c13026509f611a5a4cc95e4602d99a7f98ba61fb450c1a8dc8c09702",
                    "Gateway": "172.17.0.1",
                    "IPAddress": "172.17.0.5",
                    "IPPrefixLen": 16,
                    "IPv6Gateway": "",
                    "GlobalIPv6Address": "",
                    "GlobalIPv6PrefixLen": 0,
                    "MacAddress": "02:42:ac:11:00:05",
                    "DriverOpts": null
                }
            }
        }

```



According to kubernetes, each pod also hosts one or more containers. These containers are networked in `container` mode, meaning that they use the network attached to another container. In practice the contianers responsible for running the cassandra and experiment controller instances are hooked up to their respective pod container.

This is evidenced by running the `docker container inspect` command against the `cassandra` and `experiment controller` respectively.

```
k8s_cassandra_cassandra-0_default_2f702648-71d3-11ea-89d6-080027e049cd_1
```

contains the following entry for networkmode:

```
 "NetworkMode": "container:c5690cbdc4483cb020c9a572889e6caf0197574b30a99a77126d40d75e470538"
```

with `container:<id>` containing the id of the container that was used to provide the network (in this case the cassandra_POD container). The same can be said for the experiment controller pod.

This ultimately means that during the performance tests, the cassandra instances were able to communicate directly with eachother over the bridge network without much virtualization overhead. Overhead could be further reduced by running in host mode, eliminating the virtual bridge entirely.