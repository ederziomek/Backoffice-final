import React, { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';

interface CpaLevelValue {
  level: number;
  value: number | string;
}

interface ValidationCriteria {
  id: string;
  type: 'deposit' | 'bets' | 'ggr';
  value: number;
  enabled: boolean;
}

interface ValidationGroup {
  id: string;
  name: string;
  criteria: ValidationCriteria[];
  operator: 'AND' | 'OR'; // Entre critérios do grupo
}

interface CpaValidationRule {
  id: string;
  name: string;
  description: string;
  groups: ValidationGroup[];
  groupOperator: 'AND' | 'OR'; // Entre grupos
  active: boolean;
}

const initialCpaValues: CpaLevelValue[] = [
  { level: 1, value: 35.00 }, // R$ 35,00 - Afiliado da indicação direta
  { level: 2, value: 10.00 }, // R$ 10,00 - Upline do nível 1
  { level: 3, value: 5.00 },  // R$ 5,00  - Upline do nível 2
  { level: 4, value: 5.00 },  // R$ 5,00  - Upline do nível 3
  { level: 5, value: 5.00 }   // R$ 5,00  - Upline do nível 4
];

// Configuração padrão conforme solicitado pelo usuário
const initialValidationRules: CpaValidationRule[] = [
  {
    id: 'rule_flexible_1',
    name: 'Modelo Flexível (Padrão)',
    description: '(Depósito 30 E Apostas 10) OU (Depósito 30 E GGR 25)',
    groups: [
      {
        id: 'group_1',
        name: 'Grupo 1: Depósito + Apostas',
        criteria: [
          { id: 'dep_1', type: 'deposit', value: 30.00, enabled: true },
          { id: 'bet_1', type: 'bets', value: 10, enabled: true },
          { id: 'ggr_1', type: 'ggr', value: 0, enabled: false }
        ],
        operator: 'AND'
      },
      {
        id: 'group_2',
        name: 'Grupo 2: Depósito + GGR',
        criteria: [
          { id: 'dep_2', type: 'deposit', value: 30.00, enabled: true },
          { id: 'bet_2', type: 'bets', value: 0, enabled: false },
          { id: 'ggr_2', type: 'ggr', value: 25.00, enabled: true }
        ],
        operator: 'AND'
      }
    ],
    groupOperator: 'OR',
    active: true
  }
];

const CpaSettings: React.FC = () => {
  const [cpaValues, setCpaValues] = useState<CpaLevelValue[]>(initialCpaValues);
  const [validationRules, setValidationRules] = useState<CpaValidationRule[]>(initialValidationRules);

  const handleCpaValueChange = (index: number, newValue: string) => {
    const updatedValues = [...cpaValues];
    updatedValues[index].value = parseFloat(newValue) || 0;
    setCpaValues(updatedValues);
  };

  const calculateTotal = () => {
    return cpaValues.reduce((sum, cpa) => sum + (parseFloat(cpa.value.toString()) || 0), 0);
  };

  const handleSaveCpaValues = () => {
    const total = calculateTotal();
    console.log('Saving CPA Values:', { cpaValues, total });
    alert(`Configurações de CPA salvas! Total: R$ ${total.toFixed(2)}`);
  };

  // Funções para gerenciar regras de validação
  const handleRuleToggle = (ruleIndex: number) => {
    const updatedRules = validationRules.map((rule, i) => ({
      ...rule,
      active: i === ruleIndex // Apenas uma regra pode estar ativa
    }));
    setValidationRules(updatedRules);
  };

  const handleGroupOperatorChange = (ruleIndex: number, operator: 'AND' | 'OR') => {
    const updatedRules = [...validationRules];
    updatedRules[ruleIndex].groupOperator = operator;
    setValidationRules(updatedRules);
  };

  const handleCriteriaChange = (ruleIndex: number, groupIndex: number, criteriaIndex: number, field: keyof ValidationCriteria, value: any) => {
    const updatedRules = [...validationRules];
    (updatedRules[ruleIndex].groups[groupIndex].criteria[criteriaIndex] as any)[field] = value;
    setValidationRules(updatedRules);
  };

  const handleGroupOperatorChangeInGroup = (ruleIndex: number, groupIndex: number, operator: 'AND' | 'OR') => {
    const updatedRules = [...validationRules];
    updatedRules[ruleIndex].groups[groupIndex].operator = operator;
    setValidationRules(updatedRules);
  };

  const addNewGroup = (ruleIndex: number) => {
    const updatedRules = [...validationRules];
    const newGroup: ValidationGroup = {
      id: `group_${Date.now()}`,
      name: `Grupo ${updatedRules[ruleIndex].groups.length + 1}`,
      criteria: [
        { id: `dep_${Date.now()}`, type: 'deposit', value: 30.00, enabled: true },
        { id: `bet_${Date.now()}`, type: 'bets', value: 0, enabled: false },
        { id: `ggr_${Date.now()}`, type: 'ggr', value: 0, enabled: false }
      ],
      operator: 'AND'
    };
    updatedRules[ruleIndex].groups.push(newGroup);
    setValidationRules(updatedRules);
  };

  const removeGroup = (ruleIndex: number, groupIndex: number) => {
    const updatedRules = [...validationRules];
    if (updatedRules[ruleIndex].groups.length > 1) {
      updatedRules[ruleIndex].groups.splice(groupIndex, 1);
      setValidationRules(updatedRules);
    }
  };

  const handleSaveValidationRules = () => {
    const activeRule = validationRules.find(rule => rule.active);
    console.log('Saving CPA Validation Rules:', { validationRules, activeRule });
    alert(`Modelos de validação salvos! Regra ativa: ${activeRule?.name}`);
  };

  const getCriteriaLabel = (type: string) => {
    switch (type) {
      case 'deposit': return 'Depósito mínimo';
      case 'bets': return 'Apostas mínimas';
      case 'ggr': return 'GGR mínimo';
      default: return type;
    }
  };

  const getCriteriaUnit = (type: string) => {
    switch (type) {
      case 'deposit': return 'R$';
      case 'bets': return 'apostas';
      case 'ggr': return 'R$';
      default: return '';
    }
  };

  const generateRuleDescription = (rule: CpaValidationRule) => {
    const groupDescriptions = rule.groups.map(group => {
      const enabledCriteria = group.criteria.filter(c => c.enabled);
      const criteriaTexts = enabledCriteria.map(c => 
        `${getCriteriaLabel(c.type)}: ${c.value} ${getCriteriaUnit(c.type)}`
      );
      return `(${criteriaTexts.join(` ${group.operator} `)})`;
    });
    return groupDescriptions.join(` ${rule.groupOperator} `);
  };

  return (
    <div className="p-1 md:p-6 bg-cinza-claro rounded-lg shadow-md min-h-[400px]">
      <h2 className="text-xl lg:text-2xl font-semibold text-branco mb-6 font-sora">Gerenciamento de CPA</h2>

      {/* Informações Gerais */}
      <div className="mb-8 p-4 md:p-6 bg-cinza-escuro rounded-lg shadow">
        <h3 className="text-lg lg:text-xl font-semibold text-azul-ciano mb-4">Configurações Gerais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Total Distribuído (R$):
            </label>
            <div className="p-2 bg-gray-700 rounded border border-gray-600 text-gray-300 font-semibold">
              R$ {calculateTotal().toFixed(2)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status:
            </label>
            <div className="p-2 bg-gray-700 rounded border border-gray-600 text-green-400">
              Configurações Ativas
            </div>
          </div>
        </div>
      </div>

      {/* Distribuição por Níveis */}
      <div className="mb-8 p-4 md:p-6 bg-cinza-escuro rounded-lg shadow">
        <h3 className="text-lg lg:text-xl font-semibold text-azul-ciano mb-4">Distribuição CPA por Nível da Rede</h3>
        <p className="text-sm text-gray-400 mb-4">
          Configure como o valor total de R$ {calculateTotal().toFixed(2)} será distribuído entre os 5 níveis da rede de afiliados.
        </p>
        <div className="space-y-3">
          {cpaValues.map((cpa, index) => (
            <div key={cpa.level} className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
              <label htmlFor={`cpaLevel${cpa.level}`} className="block text-sm font-medium text-gray-300 mb-1 sm:mb-0 sm:w-1/3">
                Nível {cpa.level} {index === 0 ? '(Indicação Direta)' : `(Upline ${index})`}:
              </label>
              <div className="flex items-center gap-2 sm:w-2/3">
                <span className="text-gray-400">R$</span>
                <input
                  type="number"
                  id={`cpaLevel${cpa.level}`}
                  value={cpa.value}
                  onChange={(e) => handleCpaValueChange(index, e.target.value)}
                  className="flex-1 p-2 rounded bg-gray-700 border border-gray-600 focus:border-azul-ciano outline-none"
                  step="0.01"
                />
                <span className="text-sm text-gray-400">
                  ({calculateTotal() > 0 ? ((parseFloat(cpa.value.toString()) || 0) / calculateTotal() * 100).toFixed(1) : '0.0'}%)
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveCpaValues}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-branco bg-azul-ciano rounded-md hover:bg-opacity-80"
          >
            <Save className="w-4 h-4" />
            Salvar Distribuição CPA
          </button>
        </div>
      </div>

      {/* Modelos de Validação Flexíveis */}
      <div className="p-4 md:p-6 bg-cinza-escuro rounded-lg shadow">
        <h3 className="text-lg lg:text-xl font-semibold text-azul-ciano mb-4">Modelos de Validação CPA</h3>
        <p className="text-sm text-gray-400 mb-6">
          Configure os critérios que um novo jogador deve cumprir para validar a comissão CPA. Apenas um modelo pode estar ativo por vez.
        </p>
        
        <div className="space-y-6">
          {validationRules.map((rule, ruleIndex) => (
            <div key={rule.id} className={`p-6 border rounded-lg ${rule.active ? 'border-azul-ciano bg-azul-ciano/10' : 'border-gray-700 bg-gray-800/30'}`}>
              {/* Cabeçalho da Regra */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="text-lg font-medium text-branco">{rule.name}</h4>
                  <p className="text-sm text-gray-400 mt-1">{generateRuleDescription(rule)}</p>
                </div>
                <button 
                  onClick={() => handleRuleToggle(ruleIndex)}
                  className={`px-4 py-2 text-sm rounded-full font-medium ${rule.active ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-600 hover:bg-gray-500'} text-white`}
                >
                  {rule.active ? 'ATIVO' : 'Ativar'}
                </button>
              </div>

              {/* Operador entre Grupos */}
              <div className="mb-6 p-3 bg-gray-800 rounded-lg">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Operador entre grupos:
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`groupOperator_${rule.id}`}
                      value="AND"
                      checked={rule.groupOperator === 'AND'}
                      onChange={(e) => handleGroupOperatorChange(ruleIndex, e.target.value as 'AND' | 'OR')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-300">E (AND) - Todos os grupos devem ser atendidos</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`groupOperator_${rule.id}`}
                      value="OR"
                      checked={rule.groupOperator === 'OR'}
                      onChange={(e) => handleGroupOperatorChange(ruleIndex, e.target.value as 'AND' | 'OR')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-300">OU (OR) - Pelo menos um grupo deve ser atendido</span>
                  </label>
                </div>
              </div>

              {/* Grupos de Validação */}
              <div className="space-y-4">
                {rule.groups.map((group, groupIndex) => (
                  <div key={group.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="text-md font-medium text-branco">{group.name}</h5>
                      <div className="flex gap-2">
                        {rule.groups.length > 1 && (
                          <button
                            onClick={() => removeGroup(ruleIndex, groupIndex)}
                            className="p-1 text-red-400 hover:text-red-300"
                            title="Remover grupo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Operador dentro do Grupo */}
                    <div className="mb-4">
                      <label className="block text-xs text-gray-400 mb-2">
                        Operador entre critérios deste grupo:
                      </label>
                      <div className="flex gap-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`criteriaOperator_${group.id}`}
                            value="AND"
                            checked={group.operator === 'AND'}
                            onChange={(e) => handleGroupOperatorChangeInGroup(ruleIndex, groupIndex, e.target.value as 'AND' | 'OR')}
                            className="mr-1"
                          />
                          <span className="text-xs text-gray-300">E</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`criteriaOperator_${group.id}`}
                            value="OR"
                            checked={group.operator === 'OR'}
                            onChange={(e) => handleGroupOperatorChangeInGroup(ruleIndex, groupIndex, e.target.value as 'AND' | 'OR')}
                            className="mr-1"
                          />
                          <span className="text-xs text-gray-300">OU</span>
                        </label>
                      </div>
                    </div>

                    {/* Critérios */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {group.criteria.map((criteria, criteriaIndex) => (
                        <div key={criteria.id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={criteria.enabled}
                              onChange={(e) => handleCriteriaChange(ruleIndex, groupIndex, criteriaIndex, 'enabled', e.target.checked)}
                              className="rounded"
                            />
                            <label className="text-xs text-gray-300 font-medium">
                              {getCriteriaLabel(criteria.type)}:
                            </label>
                          </div>
                          <div className="flex items-center gap-1">
                            {criteria.type !== 'bets' && <span className="text-xs text-gray-400">R$</span>}
                            <input
                              type="number"
                              value={criteria.value}
                              onChange={(e) => handleCriteriaChange(ruleIndex, groupIndex, criteriaIndex, 'value', parseFloat(e.target.value) || 0)}
                              disabled={!criteria.enabled}
                              className={`flex-1 p-2 rounded text-sm border ${criteria.enabled ? 'bg-gray-700 border-gray-600 focus:border-azul-ciano' : 'bg-gray-800 border-gray-700 text-gray-500'} outline-none`}
                              step={criteria.type === 'bets' ? '1' : '0.01'}
                            />
                            {criteria.type === 'bets' && <span className="text-xs text-gray-400">apostas</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botão Adicionar Grupo */}
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => addNewGroup(ruleIndex)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-azul-ciano border border-azul-ciano rounded-md hover:bg-azul-ciano hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Grupo
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveValidationRules}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-branco bg-azul-ciano rounded-md hover:bg-opacity-80"
          >
            <Save className="w-4 h-4" />
            Salvar Modelos de Validação
          </button>
        </div>
      </div>
    </div>
  );
};

export default CpaSettings;

