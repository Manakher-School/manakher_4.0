import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import pb from "@/lib/pocketbase";

export interface User {
  id: string;
  name_ar: string;
  name_en: string;
  email: string;
  role: "teacher" | "student" | "admin";
  sections?: string[];
  subjects?: string[];
  expand?: { sections?: any[]; subjects?: any[] };
}

export interface ClassSection {
  id: string;
  grade_ar: string;
  grade_en: string;
  section_ar: string;
  section_en: string;
  grade_order: number;
}

export interface Subject {
  id: string;
  name_ar: string;
  name_en: string;
  code: string;
}

const USERS_QUERY_KEY = ["users"];
const SECTIONS_QUERY_KEY = ["sections"];
const SUBJECTS_QUERY_KEY = ["subjects"];

/**
 * Fetch teachers with pagination and expand data
 */
export function useTeachers(page: number = 1, pageSize: number = 10) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, "teachers", page],
    queryFn: async () => {
      const start = (page - 1) * pageSize;
      const response = await pb.collection("users").getList<User>(page, pageSize, {
        filter: 'role = "teacher"',
        expand: "sections,subjects",
        sort: "name_ar",
      });
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Fetch students with pagination and expand data
 */
export function useStudents(page: number = 1, pageSize: number = 10) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, "students", page],
    queryFn: async () => {
      const response = await pb.collection("users").getList<User>(page, pageSize, {
        filter: 'role = "student"',
        expand: "sections",
        sort: "name_ar",
      });
      return response;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * Fetch all sections (used for dropdowns)
 */
export function useSections() {
  return useQuery({
    queryKey: SECTIONS_QUERY_KEY,
    queryFn: async () => {
      return pb.collection("class_sections").getFullList<ClassSection>({
        sort: "grade_order,section_ar",
      });
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Fetch all subjects (used for dropdowns)
 */
export function useSubjects() {
  return useQuery({
    queryKey: SUBJECTS_QUERY_KEY,
    queryFn: async () => {
      return pb.collection("subjects").getFullList<Subject>({
        sort: "name_ar",
      });
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });
}

/**
 * Create or update a teacher
 */
export function useUpsertTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id?: string; name_ar: string; name_en: string; email: string; password?: string; sections?: string[]; subjects?: string[] }) => {
      if (data.id) {
        return pb.collection("users").update(data.id, data);
      }
      return pb.collection("users").create({
        ...data,
        role: "teacher",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...USERS_QUERY_KEY, "teachers"] });
    },
  });
}

/**
 * Create or update a student
 */
export function useUpsertStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id?: string; name_ar: string; name_en: string; email: string; password?: string; sections?: string[] }) => {
      if (data.id) {
        return pb.collection("users").update(data.id, data);
      }
      return pb.collection("users").create({
        ...data,
        role: "student",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...USERS_QUERY_KEY, "students"] });
    },
  });
}

/**
 * Delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      return pb.collection("users").delete(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}
