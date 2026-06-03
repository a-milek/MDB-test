FROM ubuntu

ARG GIT_PAT=aaaax
RUN apt-get update && apt-get --no-install-recommends install -y git python3 python3-pip python3.12-venv curl sudo gcc-avr avr-libc binutils-avr nginx gnupg ca-certificates && rm -rf /var/lib/apt/lists/*

RUN pip install  --break-system-packages docker-systemctl-replacement supervisor && cp -v /usr/local/bin/systemctl.py /usr/bin/systemctl

RUN git clone  --depth 1 -b payservice-test https://${GIT_PAT}@github.com/a-milek/VendingMachine.git 
RUN git clone --depth 1 -b feature/new_get_status_rework https://${GIT_PAT}@github.com/wmilek/payservice.git 

RUN mkdir -p /home/amilek/Documents && cd VendingMachine/ && chmod +x install.sh && bash -e -u -o pipefail  -x ./install.sh
RUN pip install --break-system-packages -r /payservice/requirements.txt

COPY nginx.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisor/supervisord.conf
COPY dev-update /usr/local/bin/dev-update
RUN chmod +x /usr/local/bin/dev-update

ENV VENDING_MACHINE_DEVICE_SERIAL_LCD=/dev/serial/by-path/platform-xhci-hcd.1-usb-0:2:1.0-port1
ENV VENDING_MACHINE_DEVICE_SERIAL_KEYBOARD=/dev/serial/by-path/platform-xhci-hcd.1-usb-0:2:1.0-port0

CMD ["/usr/local/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf", "-n"]

# CMD systemctl start serverbootup websocket statistics telegraf ; bash
