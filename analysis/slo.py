import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import argparse
import os

parser = argparse.ArgumentParser()
parser.add_argument('--workdir', type=str)
parser.add_argument('--name', type=str)
args = parser.parse_args()


def plot_slo_std(workdir, SLOs, experiment):
    hpa = pd.read_csv(os.path.join(workdir, 'hpa.csv'))
    sts_1 = pd.read_csv(os.path.join(workdir, 'sts-1.csv'))
    sts_2 = pd.read_csv(os.path.join(workdir, 'sts-2.csv'))
    plot_slo_df(hpa, SLOs, f'{experiment} with HPA')
    plot_slo_df(sts_1, SLOs, f'{experiment} statefulset single instance')
    plot_slo_df(sts_2, SLOs, f'{experiment} statefulset two instances')


def plot_slo(workdir, SLOs, experiment):
    files = scrape(workdir)
    for file in files:
        df = pd.read_csv(file)
        plot_slo_df(df, SLOs, f'{experiment}/{os.path.basename(file)}')

def scrape(workdir):
    files = []
    for file in os.listdir(workdir):
        if file.endswith(".csv"):
            files.append(os.path.join(workdir, file))

    return files


def plot_slo_df(df, SLOs, title):
    for slo in SLOs:
        tmp = df[df['percentile'] == slo]
        sns.lineplot(x=tmp['nodes'], y=tmp['delay'], label=f'{slo}th percentile')
    plt.xlabel('requests/s')
    plt.ylabel('delay(ms)')
    plt.title(title)
#     plt.ylim(0,350)
    plt.grid()
    plt.show()

workdir = args.workdir
experiment = args.name
plot_slo(workdir, [50, 95, 99.9], experiment)
