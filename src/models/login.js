import {routerRedux} from 'dva/router';
import {stringify} from 'qs';
import {fakeAccountLogin, getFakeCaptcha} from '@/services/api';
import {setAuthority} from '@/utils/authority';
import {getPageQuery} from '@/utils/utils';
import {reloadAuthorized} from '@/utils/Authorized';
import prompt from '../utils/prompt';

export default {
    namespace: 'login',

    state: {
        status: undefined,
    },

    effects: {
        * login({payload}, {call, put}) {
            const response = yield call(fakeAccountLogin, payload);
            if(response.result === 'false'){
                prompt.error(response.message)
            }
            if(response.user.userCode === 'system'){
                response["currentAuthority"] = "admin";
            }
            yield put({
                type: 'changeLoginStatus',
                payload: response,
            });
            // Login successfully
            if (response.result === "true") {
                reloadAuthorized();
                const urlParams = new URL(window.location.href);
                const params = getPageQuery();
                let {redirect} = params;
                if (redirect) {
                    const redirectUrlParams = new URL(redirect);
                    if (redirectUrlParams.origin === urlParams.origin) {
                        redirect = redirect.substr(urlParams.origin.length);
                        if (window.routerBase !== '/') {
                            redirect = redirect.replace(window.routerBase, '/');
                        }
                        if (redirect.match(/^\/.*#/)) {
                            redirect = redirect.substr(redirect.indexOf('#') + 1);
                        }
                    } else {
                        redirect = null;
                    }
                }
                yield put(routerRedux.replace(redirect || '/'));
            }
        },

        * getCaptcha({payload}, {call}) {
            yield call(getFakeCaptcha, payload);
        },

        * logout(_, {put}) {
            yield put({
                type: 'changeLoginStatus',
                payload: {
                    status: false,
                    currentAuthority: 'guest',
                },
            });
            reloadAuthorized();
            const {redirect} = getPageQuery();
            // redirect
            if (window.location.pathname !== '/user/login' && !redirect) {
                yield put(
                    routerRedux.replace({
                        pathname: '/user/login',
                        search: stringify({
                            redirect: window.location.href,
                        }),
                    })
                );
            }
        },
    },

    reducers: {
        changeLoginStatus(state, {payload}) {
            setAuthority(payload.currentAuthority);
            return {
                ...state,
                status: payload.status,
                type: payload.type,
            };
        },
    },
};
