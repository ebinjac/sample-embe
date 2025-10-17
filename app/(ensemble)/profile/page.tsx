import { UserProfile } from '@/components/teams/user-profile'
import { Metadata } from 'next'


export const metadata: Metadata = {
    title: 'Profile | Ensemble',
    description: 'Manage your profile and view your team registration requests',
}

export default function ProfilePage() {
    return (
        <div className=' mt-10'>
            <UserProfile />
        </div>
    )

}