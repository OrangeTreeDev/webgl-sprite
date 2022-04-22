const ua = navigator.userAgent;

export const isPC =
    /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i.exec(
        ua
    ) === null;

export const isMobile = !isPC;

export const isiPad = Boolean(/(iPad).*OS\s([\d_]+)/.exec(ua));
export const isAndroidPad = Boolean(
    /newpad/i.exec(ua.toLowerCase()) && /(android|adr)/i.exec(ua.toLowerCase())
);
export const isiPhone = Boolean(/(iPhone\sOS)\s([\d_]+)/.exec(ua));

export const isiPod = Boolean(/(iPod)(.*OS\s([\d_]+))?/.exec(ua));

export const isiOS = isiPad || isiPhone || isiPod;

export const isAndroid = Boolean(/(android|adr)/i.exec(ua));
