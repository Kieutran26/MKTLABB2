import React, { createContext, useContext, useState, useEffect } from 'react';
import { Brand } from '../types';
import { BrandService } from '../services/brandService';

interface BrandContextType {
  brands: Brand[];
  currentBrand: Brand | null;
  isLoading: boolean;
  refreshBrands: () => Promise<void>;
  switchBrand: (brandId: string) => void;
  saveBrand: (brand: Brand) => Promise<boolean>;
  deleteBrand: (id: string) => Promise<boolean>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBrands = async () => {
    setIsLoading(true);
    try {
      const loadedBrands = await BrandService.getBrands();
      setBrands(loadedBrands);

      // Determine active brand
      const activeId = BrandService.getActiveBrandId();
      if (activeId) {
        const found = loadedBrands.find(b => b.id === activeId);
        setCurrentBrand(found || (loadedBrands.length > 0 ? loadedBrands[0] : null));
      } else if (loadedBrands.length > 0) {
        // Default to first if none selected
        setCurrentBrand(loadedBrands[0]);
        BrandService.setActiveBrandId(loadedBrands[0].id);
      } else {
        setCurrentBrand(null);
      }
    } catch (error) {
      console.error('Error loading brands:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchBrand = (brandId: string) => {
    const found = brands.find(b => b.id === brandId);
    if (found) {
      setCurrentBrand(found);
      BrandService.setActiveBrandId(brandId);
    }
  };

  const saveBrand = async (brand: Brand): Promise<boolean> => {
    const success = await BrandService.saveBrand(brand);
    if (success) {
      await refreshBrands();
    }
    return success;
  };

  const deleteBrand = async (id: string): Promise<boolean> => {
    const success = await BrandService.deleteBrand(id);
    if (success) {
      if (BrandService.getActiveBrandId() === id) {
        BrandService.clearActiveBrandId();
      }
      await refreshBrands();
    }
    return success;
  };

  useEffect(() => {
    refreshBrands();
  }, []);

  return (
    <BrandContext.Provider value={{
      brands,
      currentBrand,
      isLoading,
      refreshBrands,
      switchBrand,
      saveBrand,
      deleteBrand
    }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};