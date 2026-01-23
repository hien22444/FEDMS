import { Button } from '@/components/unix';
import {
  IcArrowRight,
  IcGoogle,
  IcLogo,
  PASSWORD_REGEX,
  ROUTES,
  UserType,
} from '@/constants';
import type { IError, IUser } from '@/interfaces';
import { signUp } from '@/lib/actions';
import { userStore } from '@/stores';
import { useMutation } from '@tanstack/react-query';
import { Form, Input } from 'antd';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

interface IForm extends IUser.SignupDto {
  confirmPassword: string;
}

const SignUpPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<IForm>();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: signUp,
  });

  const onFinish = async (values: IUser.SignupDto) => {
    values.userTypes = [UserType.USER];
    await mutateAsync(values, {
      onSuccess: data => {
        toast.success('Register successfully');
        form.resetFields();
        navigate(ROUTES.DASHBOARD);
        userStore.set(data.user);
      },
      onError: error => {
        toast.error((error as IError).message[0]);
      },
    });
  };

  return (
    <div className='min-h-svh flex'>
      <div className='basis-[50%] bg-black flex items-center group relative overflow-hidden'>
        <div className='absolute inset-0 flex flex-col'>
          <div className='my-20 h-[1px] bg-orange-200/20' />
          <div className='my-20 h-[1px] bg-orange-200/20' />
          <div className='mb-40 mt-auto h-[1px] bg-orange-200/20' />
        </div>
        <div className='flex justify-between min-h-[140svh] -translate-y-40 gap-28 absolute inset-0 h-full max-w-xl mx-auto -rotate-[30deg] group-hover:rotate-[30deg] transition-all duration-[400ms] ease-in-out'>
          <div className=' w-[1px] bg-orange-200/20' />
          <div className=' w-[1px] bg-orange-200/20 -rotate-6' />
          <div className=' w-[1px] bg-orange-200/20 -rotate-12' />
        </div>
        <div className='border z-20 flex flex-col gap-10 max-w-[400px] mx-auto bg-black border-orange-200/20 text-white'>
          <div className='p-6 flex flex-col gap-10'>
            <p>
              <span className='font-semibold text-2xl pr-1'>
                React Source
              </span>{' '}
              Conf
            </p>
            <p className='text-6xl font-semibold'>
              Get inspired by sessions from our fall event
            </p>
          </div>
          <button className='bg-yellow-darker flex items-center -translate-y-4 group-hover:translate-y-0 justify-between font-medium text-xl scale-[0.85] transition-all duration-300 ease-in-out group-hover:scale-100 origin-top text-black px-6 py-5 my-1 group-hover:my-0 group-hover:py-6'>
            <p>Learn More</p>
            <IcArrowRight className='-rotate-45' />
          </button>
        </div>
      </div>
      <div className='basis-[50%] flex items-center'>
        <Form
          onFinish={onFinish}
          form={form}
          layout='vertical'
          className='p-8 pt-20 max-w-lg mx-auto w-full'
        >
          <IcLogo className='size-20 mx-auto' />

          <p className='font-bold text-2xl text-center text-blue-950'>
            React Source
          </p>
          <p className='font-semibold text-2xl text-center my-6'>
            Webcome to React Source
          </p>
          <button className='flex items-center justify-center gap-2 border-gray-default border px-6 py-3 rounded-md my-4 w-full'>
            <IcGoogle className='flex-shrink-0' />
            <p>Register with Google</p>
          </button>
          <div className='flex gap-2 items-center mb-4'>
            <span className='h-[1px] bg-gray-default w-full' />
            <span className='text-gray-sub-title'>or</span>
            <span className='h-[1px] bg-gray-default w-full' />
          </div>
          <Form.Item
            name='fullname'
            rules={[
              {
                required: true,
                message: 'Please input fullname',
              },
            ]}
          >
            <Input
              placeholder='Full name'
              type='text'
              className='h-12'
            />
          </Form.Item>
          <Form.Item
            name='email'
            rules={[
              {
                required: true,
                message: 'Please input email!',
              },
            ]}
          >
            <Input
              placeholder='Email address'
              type='email'
              className='h-12'
            />
          </Form.Item>
          <Form.Item
            name='password'
            rules={[
              {
                required: true,
                message: 'Please input password!',
              },
              {
                pattern: PASSWORD_REGEX,
                message:
                  'Least 8 characters, an uppercase letter and a number.',
              },
            ]}
          >
            <Input.Password placeholder='Password' className='h-12' />
          </Form.Item>

          <Form.Item
            name='confirmPassword'
            dependencies={['password']}
            rules={[
              {
                required: true,
                message: 'Please input confirm password!',
              },
              {
                validator: (_, value) => {
                  if (
                    !value ||
                    form.getFieldValue('password') === value
                  ) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('Confirm password does not match!'),
                  );
                },
              },
            ]}
          >
            <Input.Password
              placeholder='Confirm Password'
              className='h-12'
            />
          </Form.Item>

          <Button
            loading={isPending}
            className='w-full'
            htmlType='submit'
          >
            Continue
          </Button>

          <div className='flex justify-between items-start my-4'>
            <p className='text-center text-gray-sub-title px-6 text-xs'>
              Signing up for a Webflow account means you agree to the{' '}
              <a className='underline'>Privacy Policy</a> and{' '}
              <a className='underline'>Terms of Service</a>
            </p>
          </div>

          <p className='text-center text-gray-sub-title mt-6'>
            Already have an account?{' '}
            <Link
              to={ROUTES.SIGN_IN}
              className='underline underline-offset-2 cursor-pointer text-primary'
            >
              Sign in
            </Link>
          </p>
        </Form>
      </div>
    </div>
  );
};

export default SignUpPage;
