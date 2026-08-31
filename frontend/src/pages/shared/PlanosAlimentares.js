import React from 'react';
import { Utensils } from 'lucide-react';
import { PageHeader, Card, Empty } from '../../components/ui';

export default function PlanosAlimentares() {
  return (
    <div data-testid="planos-alimentares-page">
      <PageHeader
        title="Planos Alimentares"
        subtitle="Gerencie as dietas e recomendações alimentares das alunas"
      />
      <Card className="p-8">
        <Empty 
          title="Módulo em Desenvolvimento" 
          text="A funcionalidade de criação e gestão de Planos Alimentares será liberada em breve nas próximas atualizações." 
        />
      </Card>
    </div>
  );
}
