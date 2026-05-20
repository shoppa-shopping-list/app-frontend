export type TProduct = {
  id: number;
  name: string;
  description: string;
  status: 'catalog' | 'cart';
  priority: 'normal' | 'special';
  color: 'red' | 'yellow' | 'green' | 'blue' | 'purple' | 'white';
};

export type TUpdates = Partial<Pick<TProduct, 'description' | 'status' | 'priority' | 'color'>>;
