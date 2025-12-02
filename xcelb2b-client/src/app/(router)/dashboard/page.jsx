"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  Users,
  FileText,
  BarChart as BarChartIcon,
  PieChart,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "../../../../context/AuthContext";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/");
        return;
      }

      try {
        const [
          recentLeads,
          productsLength,
          categoriesLength,
          leadsLength,
          productsChart,
          categoriesChart,
          leadsChart,
        ] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/leads/recent`),
          axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/product/product-length`
          ),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/category/length`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/leads/leads-length`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/product/length-date`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/category/length-date`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/leads/length-date`),
        ]);

        setData({
          recentLeads: recentLeads.data.data,
          totalProducts: productsLength.data.data,
          totalCategories: categoriesLength.data.data,
          totalLeads: leadsLength.data.data,
          productsChartData: formatChartData(productsChart.data.data),
          categoriesChartData: formatChartData(categoriesChart.data.data),
          leadsChartData: formatChartData(leadsChart.data.data),
        });
      } catch (err) {
        setError("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [checkAuth, router]);

  const formatChartData = (data) => {
    return data.creationDates.map((date, index) => ({
      date: new Date(date).toLocaleDateString(),
      count: index + 1,
    }));
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  if (!data) {
    return null;
  }

  const { recentLeads, totalProducts, totalCategories, totalLeads } = data;

  const overviewData = [
    { name: "Products", value: totalProducts },
    { name: "Categories", value: totalCategories },
    { name: "Leads", value: totalLeads },
  ];

  return (
    <div className="p-3 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <StatCard
          title="Total Products"
          value={totalProducts}
          icon={<Package className="h-6 w-6 md:h-8 md:w-8" />}
        />
        <StatCard
          title="Total Categories"
          value={totalCategories}
          icon={<FileText className="h-6 w-6 md:h-8 md:w-8" />}
        />
        <StatCard
          title="Total Leads"
          value={totalLeads}
          icon={<Users className="h-6 w-6 md:h-8 md:w-8" />}
        />
      </div>

      <div className="mb-6 md:mb-8">
        <div className="flex border-b border-gray-200 mb-4">
          {["overview", "distribution"].map((tab) => (
            <button
              key={tab}
              className={`py-2 px-4 font-medium text-sm focus:outline-none ${
                activeTab === tab
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg md:text-xl">
                <BarChartIcon className="mr-2" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={overviewData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#4A90E2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {activeTab === "distribution" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg md:text-xl">
                <PieChart className="mr-2" />
                Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={overviewData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {overviewData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-gray-200">
            {recentLeads.map((lead, index) => (
              <li key={index} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <span className="inline-block h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                      <svg
                        className="h-full w-full text-gray-300"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {lead.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {lead.email}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {lead.phone}
                    </p>
                  </div>
                  <div className="inline-flex items-center text-xs text-gray-500">
                    {lead.commentsLength} comments
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <Skeleton className="h-10 w-48 mb-6 md:mb-8" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>

      <Skeleton className="h-[400px] w-full mb-6 md:mb-8" />

      <Skeleton className="h-[300px] w-full" />
    </div>
  );
}
