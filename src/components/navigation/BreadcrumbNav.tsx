import React from "react";
import { BookOpen } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const supabase = createClient(
  "https://pxmthjryoxoifxdtcevd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bXRoanJ5b3hvaWZ4ZHRjZXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwOTMzMjMsImV4cCI6MjA0OTY2OTMyM30.OdgyZdhqnNL-dt0eKkCLK0Z4ChqQ0y7O07nGcR_w474"
);

interface BreadcrumbNavProps {
  path: { id: string; content: string }[];
  onNavigate: (id: string | null) => void;
}

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ path, onNavigate }) => {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsername = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nom_de_plume')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUsername(profile.nom_de_plume);
        }
      }
    };

    fetchUsername();
  }, []);

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink 
            className={`flex items-center gap-2 transition-colors ${path.length > 0 ? 'hover:text-[#9b87f5] cursor-pointer' : ''}`}
            onClick={() => path.length > 0 ? onNavigate(null) : undefined}
          >
            <BookOpen className="h-4 w-4" />
            <span>{username}</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {path.map((item, index) => (
          <React.Fragment key={item.id}>
            <BreadcrumbSeparator>✤</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="hover:text-[#9b87f5] cursor-pointer transition-colors"
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