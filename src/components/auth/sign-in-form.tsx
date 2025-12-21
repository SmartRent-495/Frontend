'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { EyeSlashIcon } from '@phosphor-icons/react/dist/ssr/EyeSlash';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import { useUser } from '@/hooks/use-user';

const schema = zod.object({
  email: zod.string().min(1, { message: 'Email is required' }).email(),
  password: zod.string().min(1, { message: 'Password is required' }),
  adminId: zod.string().optional(),
});

type Values = zod.infer<typeof schema>;

const defaultValues = { email: '', password: '', adminId: '' } satisfies Values;

export function SignInForm(): React.JSX.Element {
  const router = useRouter();
  const { checkSession } = useUser();

  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [adminMode, setAdminMode] = React.useState(false);
  const [adminError, setAdminError] = React.useState('');

  const [isPending, setIsPending] = React.useState<boolean>(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);
      setAdminError('');

      // ✅ Only pass email/password to auth
      const { error } = await authClient.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setError('root', { type: 'server', message: error });
        setIsPending(false);
        return;
      }

      // Load user profile from backend (role + admin_id)
      const { data: user } = await authClient.getUser();

      if (adminMode) {
        const enteredAdminId = (values.adminId || '').trim();

        if (!enteredAdminId) {
          setAdminError('Admin ID is required for admin login.');
          await authClient.signOut();
          setIsPending(false);
          return;
        }

        if (user?.role !== 'admin') {
          setAdminError('Only admins can log in here.');
          await authClient.signOut();
          setIsPending(false);
          return;
        }

        // ✅ admin_id must exist and match
        if (!user?.admin_id || user.admin_id !== enteredAdminId) {
          setAdminError('Invalid Admin ID.');
          await authClient.signOut();
          setIsPending(false);
          return;
        }

        // optional: redirect admins to admin page
        router.push('/admin');
      }

      await checkSession?.();
      setIsPending(false);
    },
    [adminMode, checkSession, router, setError]
  );

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h4">Sign in</Typography>
        <Typography color="text.secondary" variant="body2">
          Don&apos;t have an account?{' '}
          <Link component={RouterLink} href={paths.auth.signUp} underline="hover" variant="subtitle2">
            Sign up
          </Link>
        </Typography>
      </Stack>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <FormControl error={Boolean(errors.email)}>
                <InputLabel>Email address</InputLabel>
                <OutlinedInput {...field} label="Email address" type="email" />
                {errors.email ? <FormHelperText>{errors.email.message}</FormHelperText> : null}
              </FormControl>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <FormControl error={Boolean(errors.password)}>
                <InputLabel>Password</InputLabel>
                <OutlinedInput
                  {...field}
                  endAdornment={
                    showPassword ? (
                      <EyeIcon
                        cursor="pointer"
                        fontSize="var(--icon-fontSize-md)"
                        onClick={(): void => {
                          setShowPassword(false);
                        }}
                      />
                    ) : (
                      <EyeSlashIcon
                        cursor="pointer"
                        fontSize="var(--icon-fontSize-md)"
                        onClick={(): void => {
                          setShowPassword(true);
                        }}
                      />
                    )
                  }
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                />
                {errors.password ? <FormHelperText>{errors.password.message}</FormHelperText> : null}
              </FormControl>
            )}
          />

          <FormControlLabel
            control={<Checkbox checked={adminMode} onChange={(e) => setAdminMode(e.target.checked)} color="primary" />}
            label="Admin Login"
          />

          {adminMode ? (
            <Controller
              control={control}
              name="adminId"
              render={({ field }) => (
                <FormControl>
                  <InputLabel>Admin ID</InputLabel>
                  <OutlinedInput {...field} label="Admin ID" />
                </FormControl>
              )}
            />
          ) : null}

          {adminError ? <Alert severity="error">{adminError}</Alert> : null}

          <div>
            <Link component={RouterLink} href={paths.auth.resetPassword} variant="subtitle2">
              Forgot password?
            </Link>
          </div>

          {errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}

          <Button disabled={isPending} type="submit" variant="contained">
            Sign in
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
