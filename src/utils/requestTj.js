/**
 * @description
 * @Version Created by Stephen on 2019/8/2.
 * @Author Stephen
 * @license dongfangdianzi
 */

import axios from 'axios';
import router from 'umi/router';
import queryString from 'query-string';
import _ from 'lodash';
// 解决IE报warning Unhandled Rejections Error 参数书不正确的问题
Promise._unhandledRejectionFn = function (rejectError) {};

const apiDomain = "http://192.168.10.122:8080/datadist/a/login";
const loginUrl = "http://192.168.10.122:8080/datadist/a/login";

const Singleton = (function () {
    let instantiated;

    function init() {

        return axios.create({
            baseURL: apiDomain,

            // `withCredentials`指示是否跨站点访问控制请求
            withCredentials: false,

            // “responseType”表示服务器将响应的数据类型
            // 包括 'arraybuffer', 'blob', 'document', 'json', 'text', 'stream'
            responseType: 'json',

            // headers`是要发送的自定义 headers
            headers: {
                // 'X-Requested-With': 'XMLHttpRequest'
            },

        });
    }

    return {
        getInstance: function () {

            if (!instantiated) {
                instantiated = init();
            }

            return instantiated;
        }
    };
})();


/**
 *
 * @param options
 * @return {Promise}
 * @private
 */
const _request = (options = {}) => {
    // const successCode = window.ENV.apiSuccessCode;

    return new Promise((resolve, reject) => {
        // const { errorCode, loginUrl, isCheckLogin } = window.ENV.login;

        Singleton.getInstance().request(options).then((resp) => {
            console.log(resp,'resp');

            const { result, user, sessionid, message } = resp.data;

            resolve({ result, sessionid, user, message });
            // if (result === "true") {
            //     resolve({ result, sessionid, user, message });
            // }
            // // 判断是否登录
            // else if (result === "login") {
            //     window.location.href = "login";
            // } else {
            //     /* eslint prefer-promise-reject-errors:0 */
            //     reject({ result, sessionid, user, message });
            // }

        }).catch((error) => {
            /* eslint prefer-promise-reject-errors:0 */
            reject({
                code: 'error',
                data: null,
                msg: error.message
            });
        });

    });
};


/**
 * get请求
 * @param {string} url
 * @param {object} params
 * @param {object} options
 * @returns {Promise}
 */
export function get(url, params = {}, options = {}) {
    Object.assign(options, {
        url,
        method: 'get',
        params: params,
    });

    return _request(options);
}

/**
 * post请求
 * @param {string} url
 * @param {object} params
 * @param {object} options
 * @returns {Promise}
 */
export function post(url, params = {}, options = {}) {
    let requestParams = new URLSearchParams();
    for (let [k, v] of Object.entries(params)) {
        requestParams.append(k, v);
    }

    options = Object.assign({
        url,
        method: 'post',
        data: requestParams,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }, options);

    return _request(options);
}


/**
 * post json请求
 * @param {string} url
 * @param {object} params
 * @param {object} options
 * @returns {Promise}
 */
export function postJSON(url, params = {}, options = {}) {
    options = Object.assign({
        url,
        method: 'post',
        data: params,
        headers: {
            'Content-Type': 'application/json'
        }
    }, options);

    return _request(options);
}


/**
 * 请求上传文件
 * @param {String} url
 * @param {Object} params
 * @param {Function} onUploadProgress
 * @param {Object} options
 * @returns {Promise}
 */
export function upload(url, params = {}, onUploadProgress = (progressEvent) => {}, options = {}) {

    if (!(params instanceof FormData)) {
        let formData = new FormData();
        for (let [k, v] of Object.entries(params)) {
            if(Array.isArray(v)){
                v.forEach((item) => formData.append(k, item));
            }else {
                formData.append(k, v);
            }
        }
        params = formData;
    }

    options = Object.assign({
        url,
        method: 'post',
        data: params,
        // `onUploadProgress`允许处理上传的进度事件
        onUploadProgress: onUploadProgress,

        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }, options);


    return _request(options);
}

/**
 * restful delete
 * @param {String} url
 * @param {Object} params
 * @param {Object} options
 * @returns {Promise}
 */
export function del(url, params = {}, options = {}) {
    options = Object.assign({
        url,
        method: 'delete',
        data: params,
        headers: {
            'Content-Type': 'application/json'
        }
    }, options);

    return _request(options);
}


/**
 * restful put
 * @param {String} url
 * @param {Object} params
 * @param {Object} options
 * @returns {Promise}
 */
export function put(url, params = {}, options = {}) {
    options = Object.assign({
        url,
        method: 'put',
        data: params,
        headers: {
            'Content-Type': 'application/json'
        }
    }, options);

    return _request(options);
}


/**
 * 并发执行多个请求
 * @returns {Promise.<*>}
 */
export function all(args = null) {

    return Array.isArray(args) ? Promise.all(args) : Promise.all([...arguments]);
}

/**
 * 发送一个form请求
 * @param {String} url
 * @param {Object<string|number>} args
 * @param {Object} opt
 * @param {String} domain
 */
export const form = (url, args = {}, opt = {}, domain = apiDomain) => {
    const options = Object.assign({
        method: 'POST',
        target: '_blank',
        submit: true
    }, opt);

    const $form = jQuery('<form></form>').hide().appendTo('body').attr({
        action: domain + url,
        method: options.method,
        target: options.target
    });

    for (let [key, value] of Object.entries(args)) {
        let newValue = value;
        if (Array.isArray(value) || _.isPlainObject(value)) {
            newValue = JSON.stringify(value);
        }
        $form.append(`<input type="hidden" name="${key}" value="${encodeURIComponent(newValue)}"/>`);
    }

    if (options.submit) {
        $form.submit();
    }

    return $form;
};

/**
 * 格式化URL参数
 * @param url
 * @param params
 * @returns {*}
 */
export function formatUrlParams(url, params = {}) {
    Object.keys(params).forEach((key, index) => {
        if (index === 0 && url.indexOf('?') === -1) {
            url += '?' + key + '=' + params[key];
        } else {
            url += '&' + key + '=' + params[key];
        }
    });

    return url;
}

/**
 * 给数据附带上appId
 * @param data
 * @returns {*|{}}
 */
export function withAppId(data) {
    data = data || {};

    // TODO 注意应为app的概念在平台中没有启用，所以暂时将appId先取固定值
    // data.appId = 1;

    return data;
}

