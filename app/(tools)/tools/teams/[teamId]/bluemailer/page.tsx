export default function Page({ params }: { params: { teamId: string } }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">BlueMailer</h1>
        <p className="text-muted-foreground">
          Email template editor and notification sender for your team.
        </p>
      </div>
      
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
        <p className="text-muted-foreground mb-4">
          Welcome to BlueMailer. Here you can manage email templates, create campaigns, and track analytics.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Total Templates</h3>
            <p className="text-2xl font-bold">12</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Active Campaigns</h3>
            <p className="text-2xl font-bold">3</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Emails Sent</h3>
            <p className="text-2xl font-bold">1,247</p>
          </div>
        </div>
      </div>
    </div>
  )
}
