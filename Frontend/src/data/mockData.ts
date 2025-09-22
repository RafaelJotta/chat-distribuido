import { User, HierarchyNode, Message, Channel } from '../types';

export const currentUser: User = {
  id: 'user-1',
  name: 'Amando Luiz',
  avatar: '',
  role: 'supervisor',
  status: 'online',
};

export const hierarchyNodes: HierarchyNode[] = [
  {
    id: 'dir-1',
    name: 'Thiago Caproni',
    role: 'director',
    isExpanded: true,
    children: [
      {
        id: 'mgr-1',
        name: 'Alessandro Augusto',
        role: 'manager',
        isExpanded: true,
        children: [
          {
            id: 'sup-1',
            name: 'Amando Luiz',
            role: 'supervisor',
          },
          {
            id: 'sup-2',
            name: 'Mariana Silva',
            role: 'supervisor',
          },
        ],
      },
      {
        id: 'mgr-2',
        name: 'Rafael Jotta',
        role: 'manager',
        children: [
          {
            id: 'sup-3',
            name: 'Bruno Santos',
            role: 'supervisor',
          },
        ],
      },
    ],
  },
];

export const channels: Channel[] = [
  {
    id: 'announcements-managers',
    name: 'Avisos para Gerentes',
    type: 'announcement',
    members: ['mgr-1', 'mgr-2'],
    targetLevel: 'manager',
  },
  {
    id: 'announcements-supervisors',
    name: 'Avisos para Supervisores',
    type: 'announcement', 
    members: ['sup-1', 'sup-2', 'sup-3'],
    targetLevel: 'supervisor',
  },
];

export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    senderId: 'dir-1',
    senderName: 'Thiago Caproni',
    senderRole: 'director',
    content: 'AVISO: Reunião de revisão dos relatórios trimestrais marcada para amanhã às 14h. Todos os gerentes devem comparecer.',
    originalContent: 'NOTICE: Quarterly reports review meeting scheduled for tomorrow at 2 PM. All managers must attend.',
    timestamp: new Date(Date.now() - 1800000),
    priority: 'normal',
    isTranslated: true,
    isSummarized: true,
    fullContent: 'AVISO OFICIAL: Precisamos revisar detalhadamente todos os relatórios trimestrais antes da apresentação para o conselho. A reunião está marcada para amanhã às 14h na sala de conferências principal. Por favor, tragam todas as análises financeiras e os gráficos de desempenho que discutimos na semana passada. Esta é uma convocação obrigatória para todos os gerentes.',
  },
  {
    id: 'msg-2',
    senderId: 'mgr-1',
    senderName: 'Alessandro Augusto',
    senderRole: 'manager',
    content: 'Recebido. Estarei presente com todos os documentos necessários.',
    timestamp: new Date(Date.now() - 1200000),
    priority: 'normal',
  },
  {
    id: 'msg-3',
    senderId: 'dir-1',
    senderName: 'Thiago Caproni',
    senderRole: 'director',
    content: 'AVISO URGENTE: Problema crítico identificado no sistema de produção. Todos os gerentes devem mobilizar suas equipes imediatamente!',
    timestamp: new Date(Date.now() - 300000),
    priority: 'urgent',
  },
];