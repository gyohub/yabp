package com.pets.api.mapper;

import com.pets.api.domain.entity.PetHistory;
import com.pets.api.dto.request.CreateHistoryRequest;
import com.pets.api.dto.request.UpdateHistoryRequest;
import com.pets.api.dto.response.PetHistoryResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface PetHistoryMapper {
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "pet", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    PetHistory toEntity(CreateHistoryRequest request);
    
    @Mapping(target = "petId", source = "pet.id")
    PetHistoryResponse toResponse(PetHistory history);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "pet", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(@MappingTarget PetHistory history, UpdateHistoryRequest request);
}
