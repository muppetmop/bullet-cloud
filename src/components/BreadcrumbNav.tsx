import { Home, ChevronRight } from "lucide-react";
import { BulletPoint } from "@/types/bullet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbNavProps {
  breadcrumbs: BulletPoint[];
  onNavigate: (bulletId: string | null) => void;
}

const BreadcrumbNav = ({ breadcrumbs, onNavigate }: BreadcrumbNavProps) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink 
            asChild
            className="hover:text-[#1EAEDB] cursor-pointer"
            onClick={() => onNavigate(null)}
          >
            <div className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </div>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {breadcrumbs.map((bullet, index) => (
          <BreadcrumbItem key={bullet.id}>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            {index === breadcrumbs.length - 1 ? (
              <BreadcrumbPage>{bullet.content || "Untitled"}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink
                className="hover:text-[#1EAEDB] cursor-pointer"
                onClick={() => onNavigate(bullet.id)}
              >
                {bullet.content || "Untitled"}
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default BreadcrumbNav;