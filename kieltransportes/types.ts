import React from 'react';

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

export interface Testimonial {
  id: number;
  name: string;
  company: string;
  text: string;
  rating: number;
}

export interface NavItem {
  label: string;
  path: string;
}

export interface TrackingStatus {
  code: string;
  status: string;
  location: string;
  timestamp: string;
  details: string;
}