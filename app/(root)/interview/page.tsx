import AgentRetell from "@/components/AgentRetell";
import {getCurrentUser} from "@/lib/action/auth.action";

const Page = async () => {

    const user = await getCurrentUser();
    return (
        <>
            <h3>Interview Generation</h3>
            <AgentRetell userName={user?.name || "User"} userId={user?.id || ""} type="generate"/>
        </>
    )
}
export default Page
