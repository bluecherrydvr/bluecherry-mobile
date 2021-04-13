
export function delay(ms) {
    return new Promise(callback => setTimeout(callback, ms));
}

class Url {
    constructor({scheme, host, port, user, password}) {
        this.scheme = scheme || '';
        this.host = host || '';
        this.port = port || '';
        this.user = user || '';
        this.password = password || '';
    }

    getSchemeString() {
        return (this.scheme ? this.scheme + ':' : '') + '//';
    }

    getCredentialString() {
        if (!this.user) {
            return '';
        }

        return this.user + (this.password ? ':' + this.password : '') + '@';
    }

    getHostString() {
        return this.host + (this.port ? ':' + this.port : '');
    }

    toString() {
        return [
            this.getSchemeString(),
            this.getCredentialString(),
            this.getHostString()
        ].join('');
    }
}

export function getAddressByCredentials({login, password, address, port = ''}, useAccountInfo = false) {

    const params = {
        scheme: 'https',
        host: address,
        port
    };
    const url = new Url(useAccountInfo ? {...params, user:login, password} : params);

    return url.toString();
}

export function getRtspAddressByCredentials({login, password, address, rtspAddress, rtspPort}) {

    const url = new Url({
        scheme: 'rtsp',
        host: rtspAddress || address,
        port: rtspPort,
        user: login,
        password
    });

    return url.toString();
}