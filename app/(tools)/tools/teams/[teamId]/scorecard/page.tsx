export default function Page({ params }: { params: { teamId: string } }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Scorecard</h1>
        <p className="text-muted-foreground">
          Track the volume and availability of applications for your team.
        </p>
      </div>
      
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
        <p className="text-muted-foreground mb-4">
          Welcome to Scorecard. Monitor application metrics, performance trends, and availability status.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Active Applications</h3>
            <p className="text-2xl font-bold">24</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Availability Score</h3>
            <p className="text-2xl font-bold">98.5%</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Daily Requests</h3>
            <p className="text-2xl font-bold">15.2K</p>
          </div>
        </div>
      </div>
    </div>
  )
}