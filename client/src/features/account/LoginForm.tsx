import { useForm } from "react-hook-form";
import { useAccount } from "../../lib/hooks/useAccount";
import { loginSchema, LoginSchema } from "../../lib/schemas/loginSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Paper, Typography } from "@mui/material";
import { GitHub, LockOpen } from "@mui/icons-material";
import TextInput from "../../app/shared/components/TextInput";
import { Link, useLocation, useNavigate } from "react-router";
import { useState } from "react";
import { toast } from "react-toastify";

// Login form component allowing users to sign in or resend verification emails

export default function LoginForm() {
    // track if the user attempted login without verifying email
    const [notVerified, setNotVerified] = useState(false);
    const { loginUser, resendConfirmationEmail } = useAccount();
    const navigate = useNavigate();
    const location = useLocation();
    const { control, handleSubmit, watch, formState: { isValid, isSubmitting } } = useForm<LoginSchema>({
        mode: 'onTouched',
        resolver: zodResolver(loginSchema)
    });
    const email = watch('email');

    // resend the account verification email
    const handleResendEmail = async () => {
        try {

            await resendConfirmationEmail.mutateAsync({email});
            setNotVerified(false);
        } catch (error) {
            console.log(error);
            toast.error('Problem sending email - please check email address');
        }
    }

    // attempt a username/password login
    const onSubmit = async (data: LoginSchema) => {
        await loginUser.mutateAsync(data, {
            onSuccess: () => {
                navigate(location.state?.from || '/activities');
            },
            onError: error => {
                if (error.message === 'NotAllowed') {
                    setNotVerified(true);
                }
            }
        });
    }

    // redirect the user to GitHub's OAuth flow
    const loginWithGithub = () => {
        const clientId = import.meta.env.VITE_GIHUB_CLIENT_ID;
        const redirectUrl = import.meta.env.VITE_REDIRECT_URL;
        window.location.href = 
            `https://github.com/login/oauth/authorize?client_id=${clientId}&redirectUri=${redirectUrl}&scope=read:user user:email`
    }

    // render the login form UI
    return (
        <Paper
            component='form'
            onSubmit={handleSubmit(onSubmit)}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                p: 3,
                gap: 3,
                maxWidth: 'md',
                mx: 'auto',
                borderRadius: 3
            }}
        >
            <Box display='flex' alignItems='center' justifyContent='center'
                gap={3} color='secondary.main'>
                <LockOpen fontSize="large" />
                <Typography variant="h4">Sign in</Typography>
            </Box>
            <TextInput label='Email' control={control} name='email' />
            <TextInput label='Password' type='password' control={control} name='password' />
            <Button
                type='submit'
                disabled={!isValid || isSubmitting}
                variant="contained"
                size="large"
            >
                Login
            </Button>
            <Button
                onClick={loginWithGithub}
                startIcon={<GitHub />}
                sx={{backgroundColor: 'black'}}
                type="button"
                variant="contained"
                size="large"
            >
                Login with Github
            </Button>
            {notVerified ? (
                <Box display='flex' flexDirection='column' justifyContent='center'>
                    <Typography textAlign='center' color='error'>
                        Your email has not been verified.  You can click the button to re-send the verification email
                    </Typography>
                    <Button
                        disabled={resendConfirmationEmail.isPending}
                        onClick={handleResendEmail}
                    >
                        Re-send email link
                    </Button>
                </Box>
            ) : (
                <Box display='flex' alignItems='center' justifyContent='center' gap={3}>
                    <Typography>
                        Forgot password? Click <Link to='/forgot-password'>here</Link>
                    </Typography>

                    <Typography sx={{ textAlign: 'center' }}>
                        Don't have an account?
                        <Typography sx={{ ml: 2 }} component={Link} to='/register' color="primary">
                            Sign up
                        </Typography>
                    </Typography>
                </Box>
            )}
        </Paper>
    )
}