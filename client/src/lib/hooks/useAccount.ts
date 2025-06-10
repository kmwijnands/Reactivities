import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoginSchema } from "../schemas/loginSchema";
import agent from "../api/agent";
import { useNavigate } from "react-router";
import { RegisterSchema } from "../schemas/registerSchema";
import { toast } from "react-toastify";
import { ChangePasswordSchema } from "../schemas/changePasswordSchema";

// Provides account related actions such as login, register and password changes

export const useAccount = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // fetch the current user once on app start
    const {data: currentUser, isLoading: loadingUserInfo} = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const response = await agent.get<User>('/account/user-info');
            return response.data;
        },
        enabled: !queryClient.getQueryData(['user']) 
    })

    // POST credentials to login
    const loginUser = useMutation({
        mutationFn: async (creds: LoginSchema) => {
            await agent.post('/login?useCookies=true', creds);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['user']
            });
        }
    });

    // create a new user account
    const registerUser = useMutation({
        mutationFn: async (creds: RegisterSchema) => {
            await agent.post('/account/register', creds)
        }
    })

    // logout the current user and clear caches
    const logoutUser = useMutation({
        mutationFn: async () => {
            await agent.post('/account/logout');
        },
        onSuccess: () => {
            queryClient.removeQueries({queryKey: ['user']});
            queryClient.removeQueries({queryKey: ['activities']});
            navigate('/');
        }
    })

    // confirm user email address
    const verifyEmail = useMutation({
        mutationFn: async ({userId, code}: {userId: string, code: string}) => {
            await agent.get(`/confirmEmail?userId=${userId}&code=${code}`)
        }
    });

    // send another verification email
    const resendConfirmationEmail = useMutation({
        mutationFn: async ({email, userId} :{email?: string, userId?: string | null}) => {
            await agent.get(`/account/resendConfirmEmail`, {
                params: {
                    email,
                    userId
                }
            })
        },
        onSuccess: () => {
            toast.success('Email sent - please check your email');
        }
    })

    // change the user's password
    const changePassword = useMutation({
        mutationFn: async (data: ChangePasswordSchema) => {
            await agent.post('/account/change-password', data);
        }
    });

    // send forgot password email
    const forgotPassword = useMutation({
        mutationFn: async (email: string) => {
            await agent.post('/forgotPassword', {email})
        }
    })

    // complete password reset with a code
    const resetPassword = useMutation({
        mutationFn: async (data: ResetPassword) => {
            await agent.post('/resetPassword', data);
        }
    });

    // exchange GitHub code for a token and login
    const fetchGithubToken = useMutation({
        mutationFn: async (code: string) => {
            const response = await agent.post(`/account/github-login?code=${code}`);
            return response.data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['user']
            })
        }
    })

    // expose helpers and state to consumers
    return {
        loginUser,
        currentUser,
        logoutUser,
        loadingUserInfo,
        registerUser,
        verifyEmail,
        resendConfirmationEmail,
        changePassword,
        forgotPassword,
        resetPassword,
        fetchGithubToken
    }
}