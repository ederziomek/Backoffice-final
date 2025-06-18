import React from 'react';
import RealDataDashboard from '../components/dashboard/RealDataDashboard';

const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-branco mb-6">Dashboard da Operação</h1>
        <p className="text-gray-400 mb-8">Dados reais do banco da operação - Sistema integrado</p>
        <RealDataDashboard />
      </div>
    </div>
  );
};

export default DashboardPage;

