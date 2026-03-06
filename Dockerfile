FROM ubuntu:24.04
LABEL authors="mengen.dai@outlokk.com"

ENV TZ=Aisa/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone