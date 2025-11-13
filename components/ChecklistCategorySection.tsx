// 체크리스트 카테고리 관리 섹션 컴포넌트
import React from 'react';
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Plus, Edit, Trash2, CheckSquare } from "lucide-react";

interface CategorySectionProps {
  categories: any[];
  onAdd: () => void;
  onEdit: (category: any) => void;
  onDelete: (category: any) => void;
  onToggleActive: (categoryId: number) => void;
  getCategoryColorClass: (color: string) => string;
}

export function ChecklistCategorySection(props: CategorySectionProps) {
  const {
    categories = [], // 기본값 제공
    onAdd,
    onEdit,
    onDelete,
    onToggleActive,
    getCategoryColorClass
  } = props;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">체크리스트 카테고리를 관리합니다</p>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="w-4 h-4 mr-1" />
          카테고리 추가
        </Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-64 overflow-y-auto">
          {categories && categories.length > 0 ? (
            categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <Badge className={getCategoryColorClass(category.color)}>
                    {category.name}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{category.description}</p>
                    <p className="text-xs text-gray-500">
                      상태: {category.active ? '활성' : '비활성'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={category.active}
                    onCheckedChange={() => onToggleActive(category.id)}
                    size="sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(category)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(category)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              <CheckSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>등록된 카테고리가 없습니다.</p>
              <p className="text-sm">카테고리를 추가하여 시작하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}