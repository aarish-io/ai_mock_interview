import AgentRetell from "@/components/AgentRetell";
import { getCurrentUser } from "@/lib/actions/auth.action";

export const dynamic = 'force-dynamic';

const Page = async () => {

    const user = await getCurrentUser();
    return (
        <>
            <h3>Interview Generation</h3>
            <AgentRetell userName={user?.name || "User"} userId={user?.id || ""} type="generate" />
        </>
    )
}
export default Page
