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
import {
  getLoginUserUsingGet,
  getUserByIdUsingGet,
  userLoginUsingPost,
  userRegisterUsingPost
} from "@/services/bi/userController";


const loginPath = '/user/register';




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



const Index: React.FC = () => {
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



  const handleSubmit = async (values: API.UserRegisterRequest) => {
    try {

      const ret = await userRegisterUsingPost(values);
      if (ret.code === 0 && ret.data) {
        // 1. 确保弹窗能正常显示（SPA路由跳转不中断）
        message.success('注册成功！');
        navigate('/user/login');
        return;

      } else {
        message.error(ret.message);

      }


    } catch (error) {

      const defaultRegisterFailureMessage = '注册失败，请重试！';
      console.log(error);
      message.error(defaultRegisterFailureMessage);
    }
  };
//  const {status, type: loginType} = userLoginState;
  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {'注册'}
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
                label: '新用户注册',
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
                placeholder={'请输入密码(不小于8位)'}
              />
              <ProFormText.Password
                name="checkPassword"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined/>,
                }}
                placeholder={'请再次输入密码'}
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

          </div>
        </LoginForm>
      </div>
      <Footer/>
    </div>
  );
};
export default Index;
