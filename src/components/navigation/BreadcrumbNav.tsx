import React from "react";
import { House } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbNavProps {
  path: { id: string; content: string }[];
  onNavigate: (id: string | null) => void;
}

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ path, onNavigate }) => {
  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink 
            asChild
            className="hover:text-primary cursor-pointer"
            onClick={() => onNavigate(null)}
          >
            <House className="h-4 w-4" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {path.map((item, index) => (
          <React.Fragment key={item.id}>
            <BreadcrumbSeparator>✤</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="hover:text-primary cursor-pointer"
                onClick={() => onNavigate(item.id)}
              >
                {item.content || "Untitled"}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default BreadcrumbNav;