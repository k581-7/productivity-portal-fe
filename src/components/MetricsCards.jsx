import './MetricsCards.css';

const MetricsCard = ({ title, value, description }) => (
  <div className="metrics-card">
    <h3>{title}</h3>
    <div className="value">{value}</div>
    <p>{description}</p>
  </div>
);

const MetricsCards = ({ data }) => {
  return (
    <div className="metrics-grid">
      <MetricsCard 
        title="Total Entries"
        value={data.total_entries}
        description="Total number of entries this month"
      />
      <MetricsCard 
        title="Manual Mapping"
        value={data.manual_mapping}
        description="Total manual mappings"
      />
      <MetricsCard 
        title="Auto Mapping"
        value={data.auto_mapping}
        description="Total auto mappings"
      />
      <MetricsCard 
        title="Success Rate"
        value={`${data.success_rate}%`}
        description="Overall success rate"
      />
    </div>
  );
};

export default MetricsCards;