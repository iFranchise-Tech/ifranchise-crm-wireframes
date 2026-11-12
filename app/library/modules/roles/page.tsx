import { UsersRolesWorkspace } from '@/modules/users-roles/components/users-roles-workspace';
export const metadata = { title: 'Users & Roles · iFranchise CRM' };
export default async function Page({searchParams}:{searchParams:Promise<{view?:string}>}) {const {view}=await searchParams;return <UsersRolesWorkspace view={view}/>}
