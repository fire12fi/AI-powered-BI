import {Footer} from '@/components';
import {
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  LoginForm,

  ProFormText,
} from '@ant-design/pro-components';
import {Helmet, Link, useModel,useNavigate} from '@umijs/max';
import { App, Tabs} from 'antd';
import {createStyles} from 'antd-style';
import React, {useState} from 'react';
import {flushSync} from 'react-dom';
import Settings from '../../../../config/defaultSettings';
import {getLoginUserUsingGet, getUserByIdUsingGet, userLoginUsingPost} from "@/services/bi/userController";


const loginPath = '/user/login';




const useStyles = createStyles(({token}) => {
  return {
    action: {
      marginLeft: '8px',
      color: 'rgba(0, 0, 0, 0.2)',
      fontSize: '24px',
      verticalAlign: 'middle',
      cursor: 'pointer',
      transition: 'color 0.3s',
      '&:hover': {
        color: token.colorPrimaryActive,
      },
    },
    lang: {
      width: 42,
      height: 42,
      lineHeight: '42px',
      position: 'fixed',
      right: 16,
      borderRadius: token.borderRadius,
      ':hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
      backgroundSize: '100% 100%',
    },
  };
});



const Login: React.FC = () => {
  const [userLoginState] = useState<API.LoginResult>({});
  const [type, setType] = useState<string>('account');
  const { setInitialState} = useModel('@@initialState');
  const {styles} = useStyles();
  const {message} = App.useApp();
  const navigate = useNavigate();

  const fetchUserInfo = async () => {
    const userInfo = await getLoginUserUsingGet();
    if (userInfo) {
      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: userInfo.data,
        }));
      });
    }
  };



  const handleSubmit = async (values: API.UserLoginRequest) => {
    try {

      const ret = await userLoginUsingPost(values);
      if (ret.code === 0 && ret.data) {
        // 1. 确保弹窗能正常显示（SPA路由跳转不中断）
        message.success('登录成功！');

        // 2. 同步更新登录态到initialState（关键：避免页面校验未登录）
        flushSync(() => {
          setInitialState((prev) => ({
            ...prev,
            currentUser: ret.data,
            isLogin: true,
          }));
        });

        const urlParams = new URL(window.location.href).searchParams;
        const redirectUrl = urlParams.get('redirect') || '/';
        navigate(redirectUrl); // 解决跳转问题
        return;

      } else {
        message.error(ret.message);

      }


    } catch (error) {

      const defaultLoginFailureMessage = '登录失败，请重试！';
      console.log(error);
      message.error(defaultLoginFailureMessage);
    }
  };
  const {status, type: loginType} = userLoginState;
  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {'登录'}
          {Settings.title && ` - ${Settings.title}`}
        </title>
      </Helmet>

      <div
        style={{
          flex: '1',
          padding: '32px 0',
        }}
      >
        <LoginForm
          contentStyle={{
            minWidth: 280,
            maxWidth: '75vw',
          }}
          logo={<img alt="logo" src="/logo.svg"/>}
          title="智能BI助手"
          subTitle={'智能BI助手 你的在线数据分析师'}
          onFinish={async (values) => {
            await handleSubmit(values as API.UserLoginRequest);
          }}
        >
          <Tabs
            activeKey={type}
            onChange={setType}
            centered
            items={[
              {
                key: 'account',
                label: '账户密码登录',
              },
            ]}
          />






          {type === 'account' && (
            <>
              <ProFormText
                name="userAccount"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined/>,
                }}
                placeholder={'请输入用户名'}

              />
              <ProFormText.Password
                name="userPassword"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined/>,
                }}
                placeholder={'请输入密码'}
              />
            </>
          )}


          <div
            style={{
              marginBottom: 16,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 16,
              paddingRight: 8,
            }}
          >
            <Link
              style={{
                padding: "0px 16px",
                color: "#1677ff",
                textDecoration: "none",
                borderRadius: 4,

              }}
              to="/user/register"
            >
              注册
            </Link>
          </div>
        </LoginForm>
      </div>
      <Footer/>
    </div>
  );
};
export default Login;
